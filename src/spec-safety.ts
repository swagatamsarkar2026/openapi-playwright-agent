export const SPEC_LIMITS = {
  bytes: 5 * 1024 * 1024,
  documentNodes: 300_000,
  references: 10_000,
  depth: 100,
  operations: 1_000
} as const;

export function assertSafeSpecSize(sizeBytes: number): void {
  if (sizeBytes > SPEC_LIMITS.bytes) {
    throw new Error(`OpenAPI specification exceeds the ${SPEC_LIMITS.bytes}-byte input limit.`);
  }
}

export function assertSafeSpecDocument(document: unknown): void {
  const pending: Array<{ value: unknown; depth: number }> = [{ value: document, depth: 0 }];
  const visited = new Set<object>();
  let nodes = 0;
  let references = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;
    nodes += 1;
    if (nodes > SPEC_LIMITS.documentNodes) {
      throw new Error("OpenAPI specification exceeds the document complexity limit.");
    }
    if (current.depth > SPEC_LIMITS.depth) {
      throw new Error("OpenAPI specification exceeds the document nesting limit.");
    }
    if (typeof current.value !== "object" || current.value === null || visited.has(current.value)) continue;
    visited.add(current.value);

    if (Array.isArray(current.value)) {
      for (const value of current.value) pending.push({ value, depth: current.depth + 1 });
      continue;
    }
    for (const [key, value] of Object.entries(current.value)) {
      if (key === "$ref" && typeof value === "string") {
        references += 1;
        if (references > SPEC_LIMITS.references) {
          throw new Error("OpenAPI specification exceeds the reference-count limit.");
        }
        if (!value.startsWith("#")) {
          throw new Error("External $ref values are disabled; inline the referenced definitions or use internal references.");
        }
      }
      pending.push({ value, depth: current.depth + 1 });
    }
  }
}

export function assertSafeOperationCount(count: number): void {
  if (count > SPEC_LIMITS.operations) {
    throw new Error(`OpenAPI specification exceeds the ${SPEC_LIMITS.operations}-operation limit.`);
  }
}
