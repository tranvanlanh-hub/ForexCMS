type LogLevel = "debug" | "info" | "warn" | "error";

type LogMetadata = Record<string, unknown>;

const SECRET_KEY_PATTERN =
  /(secret|password|token|authorization|cookie|database_url|databaseurl|s3_access_key|s3_secret|destinationurl)/i;

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack:
        process.env.NODE_ENV === "development"
          ? value.stack?.split("\n").slice(0, 6).join("\n")
          : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeMetadata(value as LogMetadata);
  }

  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }

  return value;
}

function sanitizeMetadata(metadata: LogMetadata): LogMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeValue(value),
    ]),
  );
}

export function logEvent(
  level: LogLevel,
  event: string,
  metadata: LogMetadata = {},
) {
  const record = {
    event,
    level,
    metadata: sanitizeMetadata(metadata),
    service: "forexcms",
    timestamp: new Date().toISOString(),
  };
  const message = JSON.stringify(record);

  if (level === "error") {
    console.error(message);
  } else if (level === "warn") {
    console.warn(message);
  } else {
    console.log(message);
  }
}
