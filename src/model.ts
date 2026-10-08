export type HttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export type ParameterLocation = "path" | "query" | "header" | "cookie";

export interface RequestParameter {
  name: string;
  in: ParameterLocation;
  required: boolean;
  value: unknown;
  valueSource: string;
  style: string;
  explode: boolean;
  serializationSupported: boolean;
}

export interface SchemaExpectation {
  type?: string | string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  requiredProperties: Array<{ name: string; schema?: SchemaExpectation }>;
  items?: SchemaExpectation;
}

export interface ResponseExpectation {
  status: number;
  contentType?: string;
  requiredProperties: string[];
  arrayItemRequiredProperties: string[];
  schema?: SchemaExpectation;
}

export interface DocumentedErrorResponse {
  status: number;
  description: string;
  contentType?: string;
  requiredProperties: string[];
  schema?: SchemaExpectation;
}

export type TestStepKind =
  | "prepare-url"
  | "prepare-headers"
  | "send-request"
  | "assert-status"
  | "assert-content-type"
  | "assert-response-schema"
  | "manual";

export interface TestStep {
  kind: TestStepKind;
  action: string;
  expectedResult: string;
}

export interface CaseEvidence {
  source: "openapi";
  specFingerprint: string;
  pointer: string;
}

export interface PlannedTestCase {
  id: string;
  title: string;
  caseType: "positive" | "negative" | "manual-review";
  execution: "automated" | "manual-review";
  mutating: boolean;
  method: HttpMethod;
  path: string;
  summary: string;
  parameters: RequestParameter[];
  body?: unknown;
  bodyContentType?: string;
  bodySource?: string;
  security: SecurityCredential[];
  preconditions: string[];
  expectedStatus?: number;
  responseExpectation?: ResponseExpectation;
  evidence: CaseEvidence[];
  steps: TestStep[];
  warnings: string[];
}

export type SecurityCredential =
  | { name: string; type: "bearer" | "basic" | "oauth2" }
  | {
      name: string;
      type: "apiKey";
      parameterName: string;
      parameterIn: "header" | "query" | "cookie";
    };

export interface OperationCase {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  mutating: boolean;
  parameters: RequestParameter[];
  body?: unknown;
  bodyContentType?: string;
  bodySource?: string;
  successStatuses: number[];
  responseExpectations: ResponseExpectation[];
  documentedErrorResponses: DocumentedErrorResponse[];
  security: SecurityCredential[];
  warnings: string[];
  testCases: PlannedTestCase[];
}

export interface TestPlan {
  title: string;
  version: string;
  specVersion: string;
  specFingerprint: string;
  baseUrl?: string;
  operations: OperationCase[];
}
