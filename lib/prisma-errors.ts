type MaybePrismaError = {
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
};

function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as MaybePrismaError;
  return candidate.code === code;
}

export function isPrismaMissingColumnError(error: unknown, columnName: string): boolean {
  if (!hasErrorCode(error, "P2022")) {
    return false;
  }

  const message = ((error as MaybePrismaError).message ?? "").toLowerCase();
  return message.includes(columnName.toLowerCase());
}

export function isPrismaMissingTableError(error: unknown, tableName: string): boolean {
  if (!hasErrorCode(error, "P2021")) {
    return false;
  }

  const message = ((error as MaybePrismaError).message ?? "").toLowerCase();
  return message.includes(tableName.toLowerCase());
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as MaybePrismaError).code ?? "";
  return code.startsWith("P10");
}
