const secretEnvironmentNames = /^(?:API_BEARER_TOKEN|API_OAUTH_TOKEN|API_USERNAME|API_PASSWORD|API_KEY_.+)$/i;
const sensitiveAssignment = /((?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[:=]\s*)(["']?)[^&\s"',;]+/gi;
const bearerCredential = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const basicCredential = /\bBasic\s+[A-Za-z0-9+/=]+/gi;

export function redactSensitiveText(value: string, secrets: readonly string[] = []): string {
  let redacted = value
    .replace(sensitiveAssignment, "$1[REDACTED]")
    .replace(bearerCredential, "Bearer [REDACTED]")
    .replace(basicCredential, "Basic [REDACTED]");
  const configuredSecrets = secrets.length > 0
    ? secrets
    : Object.entries(process.env)
      .filter(([name, secret]) => secretEnvironmentNames.test(name) && Boolean(secret))
      .map(([, secret]) => secret as string);

  for (const secret of configuredSecrets) {
    if (secret.length > 0) redacted = redacted.replaceAll(secret, "[REDACTED]");
  }
  return redacted;
}
