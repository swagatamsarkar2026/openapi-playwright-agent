# Example API test plan: Swagger Petstore

This file illustrates the detailed report produced by `analyze` for the Petstore fixture. It is a checked-in reference, not a runtime-generated report; run the CLI against a spec to produce a current plan.

- **API version:** 1.0.0
- **Specification:** 3.0.0
- **Default server:** `https://petstore.swagger.io/v1`
- **Operations:** 3
- **Test cases:** 4 (3 automated candidates, 1 review required)

> Automated candidates still require review. Mutating tests remain skipped unless explicitly enabled during both generation and execution.

## GET /pets

List all pets.

- Operation ID: `listPets`
- Category: Read-only
- Request parameters:
  - query `limit` (optional): `1` — source: schema-derived numeric sample.

### TC-LISTPETS-POS-200: GET /pets returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Risk:** Read-only
- **Expected status:** HTTP 200
- **Preconditions:**
  - No required parameters are declared; optional parameters are sent using the listed sample values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Construct the request URL from the configured base URL, operation path, and parameter samples.
     - Expected: Path parameters are substituted and query parameters are encoded; values come from the sources listed in the case.
  2. Set the declared content type, header parameters, and configured authentication.
     - Expected: No credential value is embedded in the generated case; configured credentials are read from environment variables.
  3. Send the request using the declared HTTP method and resolved URL.
     - Expected: The API returns a response for this request.
  4. Compare the response status with the exact documented success response for this case.
     - Expected: HTTP 200.
  5. Check the response Content-Type against the documented response media type.
     - Expected: Content-Type includes `application/json`.
  6. Check the response includes the required properties defined by the response schema.
     - Expected: Every response array item contains `id`. Every response array item contains `name`.

## POST /pets

Create a pet.

- Operation ID: `createPet`
- Category: Mutating
- Request body (`application/json`): `{"id":1,"name":"Fido"}` — source: schema-derived required fields.

### TC-CREATEPET-POS-201: POST /pets returns documented HTTP 201

- **Case type:** positive
- **Automation status:** automated candidate
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 201
- **Preconditions:**
  - No path, query, header, or cookie parameters are declared.
  - No authentication requirement is declared for this operation.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Construct the request URL from the configured base URL, operation path, and parameter samples.
     - Expected: Path parameters are substituted and query parameters are encoded; values come from the sources listed in the case.
  2. Set the declared content type, header parameters, and configured authentication.
     - Expected: No credential value is embedded in the generated case; configured credentials are read from environment variables.
  3. Serialize the `application/json` request body and send it with the operation.
     - Expected: The request body matches the documented sample derived from schema-derived required fields.
  4. Compare the response status with the exact documented success response for this case.
     - Expected: HTTP 201.

## GET /pets/{petId}

Info for a specific pet.

- Operation ID: `showPetById`
- Category: Read-only
- Request parameters:
  - path `petId` (required): `"pet-123"` — source: schema example.

### TC-SHOWPETBYID-POS-200: GET /pets/{petId} returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Risk:** Read-only
- **Expected status:** HTTP 200
- **Preconditions:**
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Construct the request URL from the configured base URL, operation path, and parameter samples.
     - Expected: Path parameters are substituted and query parameters are encoded; values come from the sources listed in the case.
  2. Set the declared content type, header parameters, and configured authentication.
     - Expected: No credential value is embedded in the generated case; configured credentials are read from environment variables.
  3. Send the request using the declared HTTP method and resolved URL.
     - Expected: The API returns a response for this request.
  4. Compare the response status with the exact documented success response for this case.
     - Expected: HTTP 200.
  5. Check the response Content-Type against the documented response media type.
     - Expected: Content-Type includes `application/json`.
  6. Check the response includes the required properties defined by the response schema.
     - Expected: Response object contains `id`. Response object contains `name`.

### TC-SHOWPETBYID-NEG-404: GET /pets/{petId} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual-review
- **Risk:** Read-only
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: Pet not found.
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send GET /pets/{petId} with the selected error-triggering input.
     - Expected: The API returns HTTP 404. Content-Type includes `application/json`. The error response object contains `code`. The error response object contains `message`.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
