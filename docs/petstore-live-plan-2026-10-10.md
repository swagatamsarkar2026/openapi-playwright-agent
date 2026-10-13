# API test plan: Swagger Petstore

- **Snapshot date:** 2026-10-10
- **Source:** `https://petstore.swagger.io/v2/swagger.json` (live Swagger 2.0 contract)
- **Specification SHA-256:** `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`
- **API version:** 1.0.7
- **Specification:** 2.0
- **Default server:** https://petstore.swagger.io/v2
- **Operations:** 20
- **Test cases:** 43 (9 automated candidates, 34 review required)

> Generated cases are contract-based starting points. Review sample values, preconditions, and warnings before execution. Mutating operations require explicit opt-in; manual-review cases are reported but not automated.

**Execution evidence:** `TC-GETINVENTORY-POS-200` passed with HTTP 200 against both the local mock and the live Petstore service. On 2026-10-11, a separate guarded attempt of `GET /pet/findByStatus?status=available` received HTTP 200 but failed at response-schema validation; it is not passing coverage. The generator fix now has regression coverage for an omitted optional `requiredProperties` field on a nested schema, and local tests/typecheck/build/discovery pass. The post-fix live case is deferred from the demo because this operation declares OAuth2 and only the Petstore API key is available. The available spec also reported a different fingerprint from this snapshot, so the edited generated test's prior approval binding is invalid. The remaining cases are analyzed candidates, not executed coverage. No live mutating operation was run.

## POST /pet/{petId}/uploadImage

uploads an image

- Operation ID: `uploadFile`
- Category: Mutating
- Request parameters:
  - path `petId` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.
- Authentication: petstore_auth (oauth2).

### TC-UPLOADFILE-POS-200: POST /pet/{petId}/uploadImage returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}~1uploadImage/post`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}~1uploadImage/post/responses/200`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 200
- **Preconditions:**
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Use an isolated test environment; this operation may create, update, or delete data.
  1. Construct the request URL from the configured base URL, operation path, and parameter samples.
     - Expected: Path parameters are substituted and query parameters are encoded; values come from the sources listed in the case.
  2. Set the declared content type, header parameters, and configured authentication.
     - Expected: No credential value is embedded in the generated case; configured credentials are read from environment variables.
  3. Send the request using the declared HTTP method and resolved URL.
     - Expected: The API returns a response for this request.
  4. Compare the response status with the exact documented success response for this case.
     - Expected: HTTP 200.
  5. Check the response Content-Type against the documented response media type.
     - Expected: Content-Type includes application/json.
Other cases in this plan are analyzed candidates, not executed coverage. No live mutating operation was run.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).
  - Swagger formData parameters require manual implementation.

## PUT /pet

Update an existing pet

- Operation ID: `updatePet`
- Category: Mutating
- Request body (`application/json`): `{"name":"doggie","photoUrls":["sample"]}` — source: schema-derived required fields.
- Authentication: petstore_auth (oauth2).

### TC-UPDATEPET-NEG-400: PUT /pet returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put/responses/400`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid ID supplied
  - No path, query, header, or cookie parameters are declared.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send PUT /pet with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - No documented 2xx response; expected status requires manual review.

### TC-UPDATEPET-NEG-404: PUT /pet returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put/responses/404`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: Pet not found
  - No path, query, header, or cookie parameters are declared.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send PUT /pet with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - No documented 2xx response; expected status requires manual review.

### TC-UPDATEPET-NEG-405: PUT /pet returns documented HTTP 405 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put/responses/405`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 405
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 405: Validation exception
  - No path, query, header, or cookie parameters are declared.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 405 response.
  2. Send PUT /pet with the selected error-triggering input.
     - Expected: The API returns HTTP 405.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - No documented 2xx response; expected status requires manual review.

### TC-UPDATEPET-REVIEW: PUT /pet needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/put`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - No documented 2xx response; expected status requires manual review.

## POST /pet

Add a new pet to the store

- Operation ID: `addPet`
- Category: Mutating
- Request body (`application/json`): `{"name":"doggie","photoUrls":["sample"]}` — source: schema-derived required fields.
- Authentication: petstore_auth (oauth2).

### TC-ADDPET-NEG-405: POST /pet returns documented HTTP 405 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/post`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/post/responses/405`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 405
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 405: Invalid input
  - No path, query, header, or cookie parameters are declared.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 405 response.
  2. Send POST /pet with the selected error-triggering input.
     - Expected: The API returns HTTP 405.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - No documented 2xx response; expected status requires manual review.

### TC-ADDPET-REVIEW: POST /pet needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet/post`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - No documented 2xx response; expected status requires manual review.

## GET /pet/findByStatus

Finds Pets by status

- Operation ID: `findPetsByStatus`
- Category: Read-only
- Request parameters:
  - query `status` (required): `""` — source: no example or schema-generated sample; style: `form`, explode: `true`, serialization: review required.
- Authentication: petstore_auth (oauth2).

### TC-FINDPETSBYSTATUS-POS-200: GET /pet/findByStatus returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByStatus/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByStatus/get/responses/200`.
- **Risk:** Read-only
- **Expected status:** HTTP 200
- **Preconditions:**
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
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
     - Expected: Content-Type includes application/json.
  6. Check the response includes the required properties defined by the response schema.
     - Expected: Response is array. Response[] is object. Response[] contains "name". Response[].name is string. Response[] contains "photoUrls". Response[].photoUrls is array. Response[].photoUrls[] is string. Every response array item contains "name". Every response array item contains "photoUrls".
- **Assumptions / review notes:**
  - Required query parameter "status" has no usable value.
  - Parameter "status" uses unsupported query serialization (style=form, explode=true).

### TC-FINDPETSBYSTATUS-NEG-400: GET /pet/findByStatus returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByStatus/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByStatus/get/responses/400`.
- **Risk:** Read-only
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid status value
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send GET /pet/findByStatus with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required query parameter "status" has no usable value.
  - Parameter "status" uses unsupported query serialization (style=form, explode=true).

## GET /pet/findByTags

Finds Pets by tags

- Operation ID: `findPetsByTags`
- Category: Read-only
- Request parameters:
  - query `tags` (required): `""` — source: no example or schema-generated sample; style: `form`, explode: `true`, serialization: review required.
- Authentication: petstore_auth (oauth2).

### TC-FINDPETSBYTAGS-POS-200: GET /pet/findByTags returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByTags/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByTags/get/responses/200`.
- **Risk:** Read-only
- **Expected status:** HTTP 200
- **Preconditions:**
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
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
     - Expected: Content-Type includes application/json.
  6. Check the response includes the required properties defined by the response schema.
     - Expected: Response is array. Response[] is object. Response[] contains "name". Response[].name is string. Response[] contains "photoUrls". Response[].photoUrls is array. Response[].photoUrls[] is string. Every response array item contains "name". Every response array item contains "photoUrls".
- **Assumptions / review notes:**
  - Required query parameter "tags" has no usable value.
  - Parameter "tags" uses unsupported query serialization (style=form, explode=true).

### TC-FINDPETSBYTAGS-NEG-400: GET /pet/findByTags returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByTags/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1findByTags/get/responses/400`.
- **Risk:** Read-only
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid tag value
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send GET /pet/findByTags with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required query parameter "tags" has no usable value.
  - Parameter "tags" uses unsupported query serialization (style=form, explode=true).

## GET /pet/{petId}

Find pet by ID

- Operation ID: `getPetById`
- Category: Read-only
- Request parameters:
  - path `petId` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.
- Authentication: api_key (apiKey).

### TC-GETPETBYID-POS-200: GET /pet/{petId} returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/get/responses/200`.
- **Risk:** Read-only
- **Expected status:** HTTP 200
- **Preconditions:**
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
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
     - Expected: Content-Type includes application/json.
  6. Check the response includes the required properties defined by the response schema.
     - Expected: Response is object. Response contains "name". Response.name is string. Response contains "photoUrls". Response.photoUrls is array. Response.photoUrls[] is string. Response object contains "name". Response object contains "photoUrls".
- **Assumptions / review notes:**
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).

### TC-GETPETBYID-NEG-400: GET /pet/{petId} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/get/responses/400`.
- **Risk:** Read-only
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid ID supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send GET /pet/{petId} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).

### TC-GETPETBYID-NEG-404: GET /pet/{petId} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/get/responses/404`.
- **Risk:** Read-only
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: Pet not found
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send GET /pet/{petId} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).

## POST /pet/{petId}

Updates a pet in the store with form data

- Operation ID: `updatePetWithForm`
- Category: Mutating
- Request parameters:
  - path `petId` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.
- Authentication: petstore_auth (oauth2).

### TC-UPDATEPETWITHFORM-NEG-405: POST /pet/{petId} returns documented HTTP 405 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/post`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/post/responses/405`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 405
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 405: Invalid input
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 405 response.
  2. Send POST /pet/{petId} with the selected error-triggering input.
     - Expected: The API returns HTTP 405.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).
  - Swagger formData parameters require manual implementation.
  - No documented 2xx response; expected status requires manual review.

### TC-UPDATEPETWITHFORM-REVIEW: POST /pet/{petId} needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/post`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).
  - Swagger formData parameters require manual implementation.
  - No documented 2xx response; expected status requires manual review.

## DELETE /pet/{petId}

Deletes a pet

- Operation ID: `deletePet`
- Category: Mutating
- Request parameters:
  - header `api_key` (optional): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.
  - path `petId` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.
- Authentication: petstore_auth (oauth2).

### TC-DELETEPET-NEG-400: DELETE /pet/{petId} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/delete`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/delete/responses/400`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid ID supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send DELETE /pet/{petId} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Parameter "api_key" uses unsupported header serialization (style=simple, explode=false).
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-DELETEPET-NEG-404: DELETE /pet/{petId} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/delete`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/delete/responses/404`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: Pet not found
  - Supply required parameters using the listed examples or schema-derived values.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send DELETE /pet/{petId} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Parameter "api_key" uses unsupported header serialization (style=simple, explode=false).
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-DELETEPET-REVIEW: DELETE /pet/{petId} needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1pet~1{petId}/delete`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - Parameter "api_key" uses unsupported header serialization (style=simple, explode=false).
  - Required path parameter "petId" has no usable value.
  - Parameter "petId" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

## GET /store/order/{orderId}

Find purchase order by ID

- Operation ID: `getOrderById`
- Category: Read-only
- Request parameters:
  - path `orderId` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.

### TC-GETORDERBYID-POS-200: GET /store/order/{orderId} returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/get/responses/200`.
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
     - Expected: Content-Type includes application/json.
- **Assumptions / review notes:**
  - Required path parameter "orderId" has no usable value.
  - Parameter "orderId" uses unsupported path serialization (style=simple, explode=false).

### TC-GETORDERBYID-NEG-400: GET /store/order/{orderId} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/get/responses/400`.
- **Risk:** Read-only
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid ID supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send GET /store/order/{orderId} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "orderId" has no usable value.
  - Parameter "orderId" uses unsupported path serialization (style=simple, explode=false).

### TC-GETORDERBYID-NEG-404: GET /store/order/{orderId} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/get/responses/404`.
- **Risk:** Read-only
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: Order not found
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send GET /store/order/{orderId} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "orderId" has no usable value.
  - Parameter "orderId" uses unsupported path serialization (style=simple, explode=false).

## DELETE /store/order/{orderId}

Delete purchase order by ID

- Operation ID: `deleteOrder`
- Category: Mutating
- Request parameters:
  - path `orderId` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.

### TC-DELETEORDER-NEG-400: DELETE /store/order/{orderId} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/delete`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/delete/responses/400`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid ID supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send DELETE /store/order/{orderId} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "orderId" has no usable value.
  - Parameter "orderId" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-DELETEORDER-NEG-404: DELETE /store/order/{orderId} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/delete`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/delete/responses/404`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: Order not found
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send DELETE /store/order/{orderId} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "orderId" has no usable value.
  - Parameter "orderId" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-DELETEORDER-REVIEW: DELETE /store/order/{orderId} needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order~1{orderId}/delete`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - Required path parameter "orderId" has no usable value.
  - Parameter "orderId" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

## POST /store/order

Place an order for a pet

- Operation ID: `placeOrder`
- Category: Mutating
- Request body (`application/json`): `{}` — source: schema-derived required fields.

### TC-PLACEORDER-POS-200: POST /store/order returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order/post`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order/post/responses/200`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 200
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
  3. Serialize the application/json request body and send it with the operation.
     - Expected: The request body matches the documented sample derived from schema-derived required fields.
  4. Compare the response status with the exact documented success response for this case.
     - Expected: HTTP 200.
  5. Check the response Content-Type against the documented response media type.
     - Expected: Content-Type includes application/json.

### TC-PLACEORDER-NEG-400: POST /store/order returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order/post`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1order/post/responses/400`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid Order
  - No path, query, header, or cookie parameters are declared.
  - No authentication requirement is declared for this operation.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send POST /store/order with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.

## GET /store/inventory

Returns pet inventories by status

- Operation ID: `getInventory`
- Category: Read-only
- Authentication: api_key (apiKey).

### TC-GETINVENTORY-POS-200: GET /store/inventory returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1inventory/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1store~1inventory/get/responses/200`.
- **Risk:** Read-only
- **Expected status:** HTTP 200
- **Preconditions:**
  - No path, query, header, or cookie parameters are declared.
  - Provide credentials for the declared security scheme(s) using the environment variables documented in README.md.
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
     - Expected: Content-Type includes application/json.

## POST /user/createWithList

Creates list of users with given input array

- Operation ID: `createUsersWithListInput`
- Category: Mutating
- Request body (`application/json`): `[{}]` — source: schema-derived array sample.

### TC-CREATEUSERSWITHLISTINPUT-REVIEW: POST /user/createWithList needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1createWithList/post`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - No documented 2xx response; expected status requires manual review.

## GET /user/{username}

Get user by user name

- Operation ID: `getUserByName`
- Category: Read-only
- Request parameters:
  - path `username` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.

### TC-GETUSERBYNAME-POS-200: GET /user/{username} returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/get/responses/200`.
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
     - Expected: Content-Type includes application/json.
- **Assumptions / review notes:**
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).

### TC-GETUSERBYNAME-NEG-400: GET /user/{username} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/get/responses/400`.
- **Risk:** Read-only
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid username supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send GET /user/{username} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).

### TC-GETUSERBYNAME-NEG-404: GET /user/{username} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/get/responses/404`.
- **Risk:** Read-only
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: User not found
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send GET /user/{username} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).

## PUT /user/{username}

Updated user

- Operation ID: `updateUser`
- Category: Mutating
- Request parameters:
  - path `username` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.
- Request body (`application/json`): `{}` — source: schema-derived required fields.

### TC-UPDATEUSER-NEG-400: PUT /user/{username} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/put`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/put/responses/400`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid user supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send PUT /user/{username} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-UPDATEUSER-NEG-404: PUT /user/{username} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/put`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/put/responses/404`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: User not found
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
  - Request body sample is sourced from schema-derived required fields; verify it is valid for the target environment.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send PUT /user/{username} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-UPDATEUSER-REVIEW: PUT /user/{username} needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/put`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

## DELETE /user/{username}

Delete user

- Operation ID: `deleteUser`
- Category: Mutating
- Request parameters:
  - path `username` (required): `""` — source: no example or schema-generated sample; style: `simple`, explode: `false`, serialization: review required.

### TC-DELETEUSER-NEG-400: DELETE /user/{username} returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/delete`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/delete/responses/400`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid username supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send DELETE /user/{username} with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-DELETEUSER-NEG-404: DELETE /user/{username} returns documented HTTP 404 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/delete`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/delete/responses/404`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Expected status:** HTTP 404
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 404: User not found
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
  - Use an isolated test environment; this operation may create, update, or delete data.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 404 response.
  2. Send DELETE /user/{username} with the selected error-triggering input.
     - Expected: The API returns HTTP 404.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

### TC-DELETEUSER-REVIEW: DELETE /user/{username} needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1{username}/delete`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - Required path parameter "username" has no usable value.
  - Parameter "username" uses unsupported path serialization (style=simple, explode=false).
  - No documented 2xx response; expected status requires manual review.

## GET /user/login

Logs user into the system

- Operation ID: `loginUser`
- Category: Read-only
- Request parameters:
  - query `username` (required): `""` — source: no example or schema-generated sample; style: `form`, explode: `false`, serialization: review required.
  - query `password` (required): `""` — source: no example or schema-generated sample; style: `form`, explode: `false`, serialization: review required.

### TC-LOGINUSER-POS-200: GET /user/login returns documented HTTP 200

- **Case type:** positive
- **Automation status:** automated candidate
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1login/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1login/get/responses/200`.
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
     - Expected: Content-Type includes application/json.
- **Assumptions / review notes:**
  - Required query parameter "username" has no usable value.
  - Parameter "username" uses unsupported query serialization (style=form, explode=false).
  - Required query parameter "password" has no usable value.
  - Parameter "password" uses unsupported query serialization (style=form, explode=false).

### TC-LOGINUSER-NEG-400: GET /user/login returns documented HTTP 400 for an error scenario

- **Case type:** negative
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1login/get`.
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1login/get/responses/400`.
- **Risk:** Read-only
- **Expected status:** HTTP 400
- **Preconditions:**
  - Define a safe error scenario that matches the documented response without using production data.
  - The specification describes HTTP 400: Invalid username/password supplied
  - Supply required parameters using the listed examples or schema-derived values.
  - No authentication requirement is declared for this operation.
- **Test steps:**
  1. Select and document an invalid, unauthorized, or unavailable-resource input that is safe for the target environment.
     - Expected: The chosen scenario is appropriate for the documented HTTP 400 response.
  2. Send GET /user/login with the selected error-triggering input.
     - Expected: The API returns HTTP 400.
- **Assumptions / review notes:**
  - Not automated: the specification documents an error status but does not identify which invalid input safely triggers it.
  - Required query parameter "username" has no usable value.
  - Parameter "username" uses unsupported query serialization (style=form, explode=false).
  - Required query parameter "password" has no usable value.
  - Parameter "password" uses unsupported query serialization (style=form, explode=false).

## GET /user/logout

Logs out current logged in user session

- Operation ID: `logoutUser`
- Category: Read-only

### TC-LOGOUTUSER-REVIEW: GET /user/logout needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1logout/get`.
- **Risk:** Read-only
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - No documented 2xx response; expected status requires manual review.

## POST /user

Create user

- Operation ID: `createUser`
- Category: Mutating
- Request body (`application/json`): `{}` — source: schema-derived required fields.

### TC-CREATEUSER-REVIEW: POST /user needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user/post`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - No documented 2xx response; expected status requires manual review.

## POST /user/createWithArray

Creates list of users with given input array

- Operation ID: `createUsersWithArrayInput`
- Category: Mutating
- Request body (`application/json`): `[{}]` — source: schema-derived array sample.

### TC-CREATEUSERSWITHARRAYINPUT-REVIEW: POST /user/createWithArray needs expected-response review

- **Case type:** manual-review
- **Automation status:** manual review
- **Specification evidence:** fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`, JSON Pointer `/paths/~1user~1createWithArray/post`.
- **Risk:** Mutating; isolated environment and explicit opt-in required
- **Preconditions:**
  - Inspect the response documentation and decide which outcome should be asserted.
- **Test steps:**
  1. Choose and document the expected response status and response assertions before automating this operation.
     - Expected: The operation has an explicit, review-approved expected outcome.
- **Assumptions / review notes:**
  - No documented 2xx response; expected status requires manual review.
