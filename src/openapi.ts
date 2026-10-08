import { compileErrors, dereference, parse, validate } from "@readme/openapi-parser";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { DocumentedErrorResponse, HttpMethod, OperationCase, ParameterLocation, PlannedTestCase, RequestParameter, ResponseExpectation, SchemaExpectation, SecurityCredential, TestPlan, TestStep } from "./model.js";
import { assertSafeOperationCount, assertSafeSpecDocument, assertSafeSpecSize } from "./spec-safety.js";

type RecordValue = Record<string, unknown>;
type ApiDocument = RecordValue & {
  openapi?: string;
  swagger?: string;
  info?: RecordValue;
};

const methods: HttpMethod[] = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

function asRecord(value: unknown): RecordValue | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as RecordValue
    : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function isJsonMediaType(value: string): boolean {
  return /^application\/json(?:\s*;|$)/i.test(value) || /\+json(?:\s*;|$)/i.test(value);
}

function schemaExpectation(input: unknown, ancestors = new Set<object>(), depth = 0): SchemaExpectation | undefined {
  const schema = asRecord(input);
  if (!schema || ancestors.has(schema) || depth > 8) return undefined;
  const seen = new Set(ancestors);
  seen.add(schema);

  const properties = asRecord(schema.properties);
  const required = new Set(asArray(schema.required).filter((name): name is string => typeof name === "string"));
  const requiredProperties = [...required].map(name => ({
    name,
    ...(properties?.[name] ? { schema: schemaExpectation(properties[name], seen, depth + 1) } : {})
  }));
  const type = typeof schema.type === "string" || (Array.isArray(schema.type) && schema.type.every(item => typeof item === "string"))
    ? schema.type as string | string[]
    : undefined;
  const enumValues = Array.isArray(schema.enum) ? schema.enum : undefined;
  const minimum = typeof schema.minimum === "number" ? schema.minimum : undefined;
  const maximum = typeof schema.maximum === "number" ? schema.maximum : undefined;
  const minLength = typeof schema.minLength === "number" ? schema.minLength : undefined;
  const maxLength = typeof schema.maxLength === "number" ? schema.maxLength : undefined;
  const items = schemaExpectation(schema.items, seen, depth + 1);
  if (!type && !enumValues && minimum === undefined && maximum === undefined
    && minLength === undefined && maxLength === undefined
    && requiredProperties.length === 0 && !items) return undefined;

  return {
    ...(type ? { type } : {}),
    ...(enumValues ? { enum: enumValues } : {}),
    ...(minimum !== undefined ? { minimum } : {}),
    ...(maximum !== undefined ? { maximum } : {}),
    ...(minLength !== undefined ? { minLength } : {}),
    ...(maxLength !== undefined ? { maxLength } : {}),
    requiredProperties,
    ...(items ? { items } : {})
  };
}

interface SampledValue {
  value: unknown;
  source: string;
}

function sampleFromSchema(input: unknown, ancestors = new Set<object>()): SampledValue | undefined {
  const schema = asRecord(input);
  if (!schema || ancestors.has(schema)) return undefined;
  const seen = new Set(ancestors);
  seen.add(schema);

  if (schema.example !== undefined) return { value: schema.example, source: "schema example" };
  if (schema.default !== undefined) return { value: schema.default, source: "schema default" };
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return { value: schema.enum[0], source: "first schema enum value" };

  for (const composition of ["oneOf", "anyOf", "allOf"]) {
    const options = asArray(schema[composition]);
    if (options.length > 0) {
      const example = sampleFromSchema(options[0], seen);
      if (example !== undefined) return example;
    }
  }

  const type = schema.type;
  if (type === "object" || asRecord(schema.properties)) {
    const properties = asRecord(schema.properties);
    const required = new Set(asArray(schema.required).filter((item): item is string => typeof item === "string"));
    const result: Record<string, unknown> = {};
    if (properties) {
      for (const [name, property] of Object.entries(properties)) {
        if (!required.has(name)) continue;
        const example = sampleFromSchema(property, seen);
        if (example !== undefined) result[name] = example.value;
      }
    }
    return { value: result, source: "schema-derived required fields" };
  }
  if (type === "array") {
    const item = sampleFromSchema(schema.items, seen);
    return { value: item === undefined ? [] : [item.value], source: "schema-derived array sample" };
  }
  if (type === "integer" || type === "number") {
    return { value: typeof schema.minimum === "number" ? schema.minimum : 1, source: "schema-derived numeric sample" };
  }
  if (type === "boolean") return { value: false, source: "schema-derived boolean sample" };
  if (type === "string") {
    if (schema.format === "date") return { value: "2025-01-01", source: "schema-derived date sample" };
    if (schema.format === "date-time") return { value: "2025-01-01T00:00:00Z", source: "schema-derived date-time sample" };
    if (schema.format === "uuid") return { value: "00000000-0000-4000-8000-000000000001", source: "schema-derived UUID sample" };
    return { value: "sample", source: "schema-derived string sample" };
  }
  return undefined;
}

function parameterValue(parameter: RecordValue): SampledValue | undefined {
  if (parameter.example !== undefined) return { value: parameter.example, source: "parameter example" };
  const examples = asRecord(parameter.examples);
  if (examples) {
    const first = asRecord(Object.values(examples)[0]);
    if (first?.value !== undefined) return { value: first.value, source: "first named parameter example" };
  }
  if (parameter.default !== undefined) return { value: parameter.default, source: "parameter default" };
  if (Array.isArray(parameter.enum) && parameter.enum.length > 0) {
    return { value: parameter.enum[0], source: "first parameter enum value" };
  }
  return sampleFromSchema(parameter.schema);
}

function getBaseUrl(document: ApiDocument): string | undefined {
  const server = asRecord(asArray(document.servers)[0]);
  if (server && typeof server.url === "string") {
    let url = server.url;
    const variables = asRecord(server.variables);
    if (variables) {
      for (const [name, variableValue] of Object.entries(variables)) {
        const variable = asRecord(variableValue);
        if (typeof variable?.default === "string") {
          url = url.replaceAll(`{${name}}`, variable.default);
        }
      }
    }
    return url.includes("{") ? undefined : url;
  }

  if (typeof document.swagger === "string") {
    const host = stringValue(document.host, "");
    const basePath = stringValue(document.basePath, "/");
    const scheme = stringValue(asArray(document.schemes)[0], "https");
    return host ? `${scheme}://${host}${basePath}` : undefined;
  }
  return undefined;
}

function mergeParameters(pathParameters: unknown[], operationParameters: unknown[]): RecordValue[] {
  const merged = new Map<string, RecordValue>();
  for (const parameter of [...pathParameters, ...operationParameters]) {
    const item = asRecord(parameter);
    if (!item) continue;
    const name = stringValue(item.name, "");
    const location = stringValue(item.in, "");
    if (name && location) merged.set(`${location}:${name}`, item);
  }
  return [...merged.values()];
}

function parameterSerialization(parameter: RecordValue, document: ApiDocument, value: unknown): {
  style: string;
  explode: boolean;
  supported: boolean;
} {
  const location = parameter.in;
  const primitive = (item: unknown): boolean =>
    item === null || ["string", "number", "boolean"].includes(typeof item);
  const isFlatArray = Array.isArray(value) && value.every(primitive);
  const objectValue = asRecord(value);
  const isFlatObject = objectValue !== undefined && Object.values(objectValue).every(primitive);
  const isSimpleValue = primitive(value) || isFlatArray || isFlatObject;

  let style: string;
  let explode: boolean;
  if (document.swagger === "2.0") {
    const collectionFormat = stringValue(parameter.collectionFormat, "csv");
    style = collectionFormat === "multi" ? "form"
      : collectionFormat === "ssv" ? "spaceDelimited"
        : collectionFormat === "pipes" ? "pipeDelimited"
          : collectionFormat === "csv" ? (location === "path" || location === "header" ? "simple" : "form")
            : collectionFormat;
    explode = collectionFormat === "multi";
  } else {
    style = stringValue(parameter.style,
      location === "query" || location === "cookie" ? "form" : "simple");
    explode = parameter.explode === undefined
      ? style === "form"
      : parameter.explode === true;
  }

  const supported = parameter.allowReserved !== true && (location === "query"
    ? style === "form"
      && isSimpleValue
      || ((style === "spaceDelimited" || style === "pipeDelimited") && isFlatArray && !explode)
      || (style === "deepObject" && isFlatObject && explode)
    : location === "path"
      ? style === "simple" && (primitive(value) || isFlatArray)
      : location === "header"
        ? style === "simple" && isSimpleValue
        : false);
  return { style, explode, supported };
}

function describeSchema(schema: SchemaExpectation | undefined, path = "Response"): string[] {
  if (!schema) return [];
  const assertions: string[] = [];
  if (schema.type) assertions.push(`${path} is ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}.`);
  if (schema.enum) assertions.push(`${path} matches one of its documented enum values.`);
  if (schema.minimum !== undefined) assertions.push(`${path} is at least ${schema.minimum}.`);
  if (schema.maximum !== undefined) assertions.push(`${path} is at most ${schema.maximum}.`);
  if (schema.minLength !== undefined) assertions.push(`${path} has at least ${schema.minLength} characters.`);
  if (schema.maxLength !== undefined) assertions.push(`${path} has at most ${schema.maxLength} characters.`);
  for (const property of schema.requiredProperties) {
    assertions.push(`${path} contains "${property.name}".`);
    assertions.push(...describeSchema(property.schema, `${path}.${property.name}`));
  }
  if (schema.items) assertions.push(...describeSchema(schema.items, `${path}[]`));
  return assertions;
}

function requestBody(operation: RecordValue, document: ApiDocument): {
  body?: unknown;
  contentType?: string;
  source?: string;
  warning?: string;
} {
  let bodySchema: unknown;
  let source: string | undefined;
  let contentType: string | undefined;
  const body = asRecord(operation.requestBody);
  if (body) {
    const content = asRecord(body.content);
    if (!content) return { warning: "Request body has no content schema; manual review required." };
    const mediaTypes = Object.keys(content);
    const preferred = mediaTypes.find(isJsonMediaType) ?? mediaTypes[0];
    if (!preferred) return { warning: "Request body has no supported media type." };
    if (!isJsonMediaType(preferred)) {
      return { warning: `Request media type ${preferred} is not JSON and requires manual implementation.` };
    }
    const media = asRecord(content[preferred]);
    if (media?.example !== undefined) {
      bodySchema = media.example;
      source = "request media example";
    } else {
      const examples = asRecord(media?.examples);
      const firstExample = examples ? asRecord(Object.values(examples)[0]) : undefined;
      if (firstExample?.value !== undefined) {
        bodySchema = firstExample.value;
        source = "first named request media example";
      } else {
        const sample = sampleFromSchema(media?.schema);
        bodySchema = sample?.value;
        source = sample?.source;
      }
    }
    contentType = preferred;
  } else if (typeof document.swagger === "string") {
    const bodyParameter = asArray(operation.parameters)
      .map(asRecord)
      .find(parameter => parameter?.in === "body");
    if (bodyParameter) {
      const sample = parameterValue({ schema: bodyParameter.schema });
      bodySchema = sample?.value;
      source = sample?.source;
      contentType = stringValue(asArray(operation.consumes)[0], stringValue(asArray(document.consumes)[0], "application/json"));
      if (!isJsonMediaType(contentType)) {
        return { warning: `Swagger body media type ${contentType} requires manual implementation.` };
      }
      if (bodySchema === undefined && bodyParameter.required === true) {
        return { warning: "Required request body has no safe sample; manual review required." };
      }
    }
    const formParameter = asArray(operation.parameters)
      .map(asRecord)
      .find(parameter => parameter?.in === "formData");
    if (formParameter) {
      return { warning: "Swagger formData parameters require manual implementation." };
    }
  }

  if (bodySchema === undefined && body?.required === true) {
    return { warning: "Required request body has no safe sample; manual review required." };
  }
  return { body: bodySchema, contentType, source };
}

function responseExpectations(operation: RecordValue, document: ApiDocument): {
  statuses: number[];
  expectations: ResponseExpectation[];
} {
  const responses = asRecord(operation.responses);
  const statuses: number[] = [];
  const expectations: ResponseExpectation[] = [];
  if (!responses) return { statuses, expectations };

  for (const [statusCode, responseValue] of Object.entries(responses)) {
    if (!/^2\d\d$/.test(statusCode)) continue;
    const status = Number(statusCode);
    statuses.push(status);
    const response = asRecord(responseValue);
    if (!response) continue;

    const content = asRecord(response.content);
    const mediaType = content
      ? (content["application/json"] ? "application/json" : Object.keys(content)[0])
      : stringValue(asArray(operation.produces)[0], stringValue(asArray(document.produces)[0], ""));
    const media = mediaType && content ? asRecord(content[mediaType]) : undefined;
    const schema = asRecord(media?.schema ?? response.schema);
    const jsonResponse = mediaType ? isJsonMediaType(mediaType) : true;
    const expectationSchema = jsonResponse ? schemaExpectation(schema) : undefined;
    const properties = jsonResponse
      ? asArray(schema?.required).filter((item): item is string => typeof item === "string")
      : [];
    const itemSchema = asRecord(schema?.items);
    const itemRequired = jsonResponse
      ? asArray(itemSchema?.required).filter((item): item is string => typeof item === "string")
      : [];
    expectations.push({
      status,
      ...(mediaType ? { contentType: mediaType } : {}),
      requiredProperties: properties,
      arrayItemRequiredProperties: itemRequired,
      ...(expectationSchema ? { schema: expectationSchema } : {})
    });
  }
  return { statuses, expectations };
}

function documentedErrorResponses(operation: RecordValue): DocumentedErrorResponse[] {
  const responses = asRecord(operation.responses);
  if (!responses) return [];
  return Object.entries(responses)
    .filter(([status]) => /^4\d\d$/.test(status))
    .map(([status, value]) => {
      const response = asRecord(value);
      const content = asRecord(response?.content);
      const mediaTypes = content ? Object.keys(content) : [];
      const contentType = mediaTypes.find(isJsonMediaType) ?? mediaTypes[0];
      const media = contentType && content ? asRecord(content[contentType]) : undefined;
      const schema = asRecord(media?.schema ?? response?.schema);
      const expectationSchema = contentType && !isJsonMediaType(contentType) ? undefined : schemaExpectation(schema);
      const requiredProperties = contentType && !isJsonMediaType(contentType)
        ? []
        : asArray(schema?.required).filter((item): item is string => typeof item === "string");
      return {
        status: Number(status),
        description: stringValue(response?.description, "Documented client error response."),
        ...(contentType ? { contentType } : {}),
        requiredProperties,
        ...(expectationSchema ? { schema: expectationSchema } : {})
      };
    });
}

function caseId(operationId: string, suffix: string): string {
  const operation = operationId.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
  return `TC-${operation}-${suffix}`;
}

function buildTestCases(operation: OperationCase): PlannedTestCase[] {
  const basePreconditions = [
    operation.parameters.some(parameter => parameter.required)
      ? "Supply required parameters using the listed examples or schema-derived values."
      : operation.parameters.length > 0
        ? "No required parameters are declared; optional parameters are sent using the listed sample values."
        : "No path, query, header, or cookie parameters are declared.",
    operation.security.length > 0
      ? "Provide credentials for the declared security scheme(s) using the environment variables documented in README.md."
      : "No authentication requirement is declared for this operation."
  ];
  if (operation.body !== undefined) {
    basePreconditions.push(`Request body sample is sourced from ${operation.bodySource ?? "the OpenAPI schema"}; verify it is valid for the target environment.`);
  }
  if (operation.mutating) {
    basePreconditions.push("Use an isolated test environment; this operation may create, update, or delete data.");
  }

  const cases: PlannedTestCase[] = [];
  for (const expectation of operation.responseExpectations) {
    const id = caseId(operation.id, `POS-${expectation.status}`);
    const steps: TestStep[] = [
      {
        kind: "prepare-url",
        action: "Construct the request URL from the configured base URL, operation path, and parameter samples.",
        expectedResult: `Path parameters are substituted and query parameters are encoded; values come from the sources listed in the case.`
      },
      {
        kind: "prepare-headers",
        action: "Set the declared content type, header parameters, and configured authentication.",
        expectedResult: "No credential value is embedded in the generated case; configured credentials are read from environment variables."
      },
      ...(operation.body !== undefined ? [{
        kind: "send-request" as const,
        action: `Serialize the ${operation.bodyContentType ?? "declared"} request body and send it with the operation.`,
        expectedResult: `The request body matches the documented sample derived from ${operation.bodySource ?? "the schema"}.`
      }] : []),
      ...((operation.body === undefined) ? [{
        kind: "send-request" as const,
        action: "Send the request using the declared HTTP method and resolved URL.",
        expectedResult: "The API returns a response for this request."
      }] : []),
      {
        kind: "assert-status",
        action: "Compare the response status with the exact documented success response for this case.",
        expectedResult: `HTTP ${expectation.status}.`
      },
      ...(expectation.contentType ? [{
        kind: "assert-content-type" as const,
        action: "Check the response Content-Type against the documented response media type.",
        expectedResult: `Content-Type includes ${expectation.contentType}.`
      }] : []),
      ...((expectation.requiredProperties.length > 0 || expectation.arrayItemRequiredProperties.length > 0) ? [{
        kind: "assert-response-schema" as const,
        action: "Check the response includes the required properties defined by the response schema.",
        expectedResult: [...new Set([
          ...describeSchema(expectation.schema),
          ...expectation.requiredProperties.map(name => `Response object contains "${name}".`),
          ...expectation.arrayItemRequiredProperties.map(name => `Every response array item contains "${name}".`)
        ])].join(" ")
      }] : [])
    ];
    cases.push({
      id,
      title: `${operation.method.toUpperCase()} ${operation.path} returns documented HTTP ${expectation.status}`,
      caseType: "positive",
      execution: "automated",
      mutating: operation.mutating,
      method: operation.method,
      path: operation.path,
      summary: operation.summary,
      parameters: operation.parameters,
      ...(operation.body !== undefined ? { body: operation.body } : {}),
      ...(operation.bodyContentType ? { bodyContentType: operation.bodyContentType } : {}),
      ...(operation.bodySource ? { bodySource: operation.bodySource } : {}),
      security: operation.security,
      preconditions: basePreconditions,
      expectedStatus: expectation.status,
      responseExpectation: expectation,
      steps,
      warnings: operation.warnings
    });
  }

  for (const error of operation.documentedErrorResponses) {
    cases.push({
      id: caseId(operation.id, `NEG-${error.status}`),
      title: `${operation.method.toUpperCase()} ${operation.path} returns documented HTTP ${error.status} for an error scenario`,
      caseType: "negative",
      execution: "manual-review",
      mutating: operation.mutating,
      method: operation.method,
      path: operation.path,
      summary: operation.summary,
      parameters: operation.parameters,
      ...(operation.body !== undefined ? { body: operation.body } : {}),
      ...(operation.bodyContentType ? { bodyContentType: operation.bodyContentType } : {}),
      ...(operation.bodySource ? { bodySource: operation.bodySource } : {}),
      security: operation.security,
      preconditions: [
        "Define a safe error scenario that matches the documented response without using production data.",
        `The specification describes HTTP ${error.status}: ${error.description}`,
        ...basePreconditions
      ],
      expectedStatus: error.status,
      ...(error.contentType || error.requiredProperties.length > 0 ? {
        responseExpectation: {
          status: error.status,
          ...(error.contentType ? { contentType: error.contentType } : {}),
          requiredProperties: error.requiredProperties,
          arrayItemRequiredProperties: [],
          ...(error.schema ? { schema: error.schema } : {})
        }
      } : {}),
      steps: [
        {
          kind: "manual",
          action: "Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.",
          expectedResult: `The chosen scenario is appropriate for the documented HTTP ${error.status} response.`
        },
        {
          kind: "manual",
          action: `Send ${operation.method.toUpperCase()} ${operation.path} with the selected error-triggering input.`,
          expectedResult: [
            `The API returns HTTP ${error.status}.`,
            ...(error.contentType ? [`Content-Type includes ${error.contentType}.`] : []),
            ...error.requiredProperties.map(name => `The error response object contains "${name}".`)
          ].join(" ")
        }
      ],
      warnings: [
        "Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.",
        ...operation.warnings
      ]
    });
  }

  if (operation.successStatuses.length === 0) {
    cases.push({
      id: caseId(operation.id, "REVIEW"),
      title: `${operation.method.toUpperCase()} ${operation.path} needs expected-response review`,
      caseType: "manual-review",
      execution: "manual-review",
      mutating: operation.mutating,
      method: operation.method,
      path: operation.path,
      summary: operation.summary,
      parameters: operation.parameters,
      ...(operation.body !== undefined ? { body: operation.body } : {}),
      ...(operation.bodyContentType ? { bodyContentType: operation.bodyContentType } : {}),
      ...(operation.bodySource ? { bodySource: operation.bodySource } : {}),
      security: operation.security,
      preconditions: ["Inspect the response documentation and decide which outcome should be asserted."],
      steps: [{
        kind: "manual",
        action: "Choose and document the expected response status and response assertions before automating this operation.",
        expectedResult: "The operation has an explicit, review-approved expected outcome."
      }],
      warnings: operation.warnings
    });
  }
  return cases;
}

function securityRequirements(
  operation: RecordValue,
  document: ApiDocument
): { credentials: SecurityCredential[]; warnings: string[] } {
  const requirements = operation.security === undefined
    ? asArray(document.security)
    : asArray(operation.security);
  const firstRequirement = asRecord(requirements[0]);
  if (!firstRequirement) return { credentials: [], warnings: [] };

  const openApiSchemes = asRecord(asRecord(document.components)?.securitySchemes);
  const swaggerSchemes = asRecord(document.securityDefinitions);
  const definitions = openApiSchemes ?? swaggerSchemes;
  if (!definitions) {
    return { credentials: [], warnings: ["Security is declared but its schemes could not be resolved."] };
  }

  const credentials: SecurityCredential[] = [];
  const warnings: string[] = requirements.length > 1
    ? ["Multiple alternative security requirements are declared; only the first is modeled and this case needs review."]
    : [];
  for (const name of Object.keys(firstRequirement)) {
    const definition = asRecord(definitions[name]);
    if (!definition) {
      warnings.push(`Security scheme "${name}" could not be resolved.`);
      continue;
    }
    const type = definition.type;
    if (type === "http") {
      const scheme = String(definition.scheme).toLowerCase();
      if (scheme === "bearer") credentials.push({ name, type: "bearer" });
      else if (scheme === "basic") credentials.push({ name, type: "basic" });
      else warnings.push(`HTTP security scheme "${name}" (${scheme}) is not supported.`);
    } else if (type === "apiKey" && ["header", "query", "cookie"].includes(String(definition.in))) {
      credentials.push({
        name,
        type: "apiKey",
        parameterName: String(definition.name),
        parameterIn: definition.in as "header" | "query" | "cookie"
      });
    } else if (type === "oauth2") {
      credentials.push({ name, type: "oauth2" });
    } else if (type === "basic") {
      credentials.push({ name, type: "basic" });
    } else if (type === "openIdConnect") {
      credentials.push({ name, type: "oauth2" });
    } else {
      warnings.push(`Security scheme "${name}" uses unsupported type "${String(type)}".`);
    }
  }
  return { credentials, warnings };
}

export async function buildTestPlan(specPath: string): Promise<TestPlan> {
  const inputPath = resolve(specPath);
  const fileStats = await stat(inputPath);
  assertSafeSpecSize(fileStats.size);
  const parsedDocument = await parse(inputPath, { timeoutMs: 10_000 });
  assertSafeSpecDocument(parsedDocument);
  const parserOptions = {
    resolve: { external: false, file: false },
    timeoutMs: 10_000,
    validate: { errors: { codeFrames: false } }
  };
  const validation = await validate(parsedDocument, parserOptions);
  if (!validation.valid) throw new Error(compileErrors(validation));
  const document = await dereference(parsedDocument, parserOptions) as ApiDocument;
  const specVersion = stringValue(document.openapi, stringValue(document.swagger, "unknown"));
  if (specVersion === "unknown" || (!document.openapi?.startsWith("3.") && document.swagger !== "2.0")) {
    throw new Error(`Unsupported Swagger/OpenAPI version: ${specVersion}`);
  }

  const paths = asRecord(document.paths);
  if (!paths) throw new Error("The API specification does not define paths.");
  const operationCount = Object.values(paths).reduce<number>((count, pathItemValue) => {
    const pathItem = asRecord(pathItemValue);
    return count + (pathItem ? methods.filter(method => asRecord(pathItem[method])).length : 0);
  }, 0);
  assertSafeOperationCount(operationCount);
  const operations: OperationCase[] = [];

  for (const [path, pathItemValue] of Object.entries(paths)) {
    const pathItem = asRecord(pathItemValue);
    if (!pathItem) continue;
    for (const method of methods) {
      const operation = asRecord(pathItem[method]);
      if (!operation) continue;
      const id = stringValue(operation.operationId, `${method}_${path.replace(/[^a-zA-Z0-9]+/g, "_")}`);
      const warnings: string[] = [];
      const parameters: RequestParameter[] = [];

      for (const parameter of mergeParameters(asArray(pathItem.parameters), asArray(operation.parameters))) {
        const location = parameter.in;
        if (!["path", "query", "header", "cookie"].includes(String(location))) continue;
        const sample = parameterValue(parameter);
        if (sample === undefined && parameter.required === true) {
          warnings.push(`Required ${String(location)} parameter "${String(parameter.name)}" has no usable value.`);
        }
        const value = sample?.value;
        const serialization = parameterSerialization(parameter, document, value);
        if (!serialization.supported) {
          warnings.push(`Parameter "${String(parameter.name)}" uses unsupported ${String(location)} serialization (style=${serialization.style}, explode=${serialization.explode}).`);
        }
        if (location === "cookie") {
          warnings.push(`Cookie parameter "${String(parameter.name)}" requires manual implementation.`);
        }
        parameters.push({
          name: String(parameter.name),
          in: location as ParameterLocation,
          required: parameter.required === true,
          value: value ?? "",
          valueSource: sample?.source ?? "no example or schema-generated sample",
          style: serialization.style,
          explode: serialization.explode,
          serializationSupported: serialization.supported
        });
      }

      const body = requestBody(operation, document);
      if (body.warning) warnings.push(body.warning);
      const responses = responseExpectations(operation, document);
      const errors = documentedErrorResponses(operation);
      const securityResult = securityRequirements(operation, document);
      warnings.push(...securityResult.warnings);
      if (responses.statuses.length === 0) warnings.push("No documented 2xx response; expected status requires manual review.");
      const mutating = ["post", "put", "patch", "delete"].includes(method);
      operations.push({
        id,
        method,
        path,
        summary: stringValue(operation.summary, stringValue(operation.description, id)),
        mutating,
        parameters,
        ...(body.body !== undefined ? { body: body.body } : {}),
        ...(body.contentType ? { bodyContentType: body.contentType } : {}),
        ...(body.source ? { bodySource: body.source } : {}),
        successStatuses: responses.statuses,
        responseExpectations: responses.expectations,
        documentedErrorResponses: errors,
        security: securityResult.credentials,
        warnings,
        testCases: []
      });
      const plannedOperation = operations[operations.length - 1];
      if (plannedOperation) plannedOperation.testCases = buildTestCases(plannedOperation);
    }
  }

  const info = asRecord(document.info);
  return {
    title: stringValue(info?.title, "Untitled API"),
    version: stringValue(info?.version, "unknown"),
    specVersion,
    baseUrl: getBaseUrl(document),
    operations
  };
}
