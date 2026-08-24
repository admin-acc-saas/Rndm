import { BadRequestException } from "@nestjs/common";

/**
 * Dependency-free request validation helpers. The project deliberately avoids
 * pulling in a schema library; these functions enforce the same guarantees
 * with explicit, readable checks. All throw BadRequestException on invalid
 * input so controllers stay declarative.
 */

export function requireString(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string") {
    throw new BadRequestException(`${field} must be a string`);
  }
  const trimmed = value.trim();
  const min = opts.min ?? 1;
  if (trimmed.length < min) {
    throw new BadRequestException(`${field} is required`);
  }
  if (opts.max !== undefined && trimmed.length > opts.max) {
    throw new BadRequestException(`${field} must be at most ${opts.max} characters`);
  }
  return trimmed;
}

export function optionalString(
  value: unknown,
  field: string,
  opts: { max?: number } = {},
): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, field, opts);
}

export function requireTrue(value: unknown, field: string): true {
  if (value !== true) {
    throw new BadRequestException(`${field} must be accepted`);
  }
  return true;
}

export function requireStringArray(
  value: unknown,
  field: string,
  opts: { min?: number; maxItems?: number; maxItemLength?: number } = {},
): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException(`${field} must be an array of strings`);
  }
  const items = value.map((item) => requireString(item, field, { max: opts.maxItemLength ?? 40 }));
  const min = opts.min ?? 1;
  if (items.length < min) {
    throw new BadRequestException(`${field} must contain at least ${min} item(s)`);
  }
  if (opts.maxItems !== undefined && items.length > opts.maxItems) {
    throw new BadRequestException(`${field} must contain at most ${opts.maxItems} items`);
  }
  return items;
}

/** Validate an ISO date (YYYY-MM-DD) string. */
export function requireIsoDate(value: unknown, field: string): string {
  const str = requireString(value, field, { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || Number.isNaN(Date.parse(str))) {
    throw new BadRequestException(`${field} must be a valid date (YYYY-MM-DD)`);
  }
  return str;
}

export function optionalIsoDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireIsoDate(value, field);
}

/** Validate a plain JSON-serializable object. */
export function requireRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BadRequestException(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

/** Validate an integer within inclusive bounds. */
export function requireIntInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new BadRequestException(`${field} must be an integer`);
  }
  if (value < min || value > max) {
    throw new BadRequestException(`${field} must be between ${min} and ${max}`);
  }
  return value;
}
