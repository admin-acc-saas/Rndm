import { BadRequestException } from "@nestjs/common";
import {
  optionalIsoDate,
  optionalString,
  requireIntInRange,
  requireIsoDate,
  requireRecord,
  requireString,
  requireStringArray,
  requireTrue,
} from "../src/common/validation";

describe("validation helpers", () => {
  it("requireString trims and enforces bounds", () => {
    expect(requireString("  hello  ", "name")).toBe("hello");
    expect(() => requireString("", "name")).toThrow(BadRequestException);
    expect(() => requireString("x".repeat(81), "name", { max: 80 })).toThrow(
      BadRequestException,
    );
    expect(() => requireString(42, "name")).toThrow(BadRequestException);
  });

  it("optionalString returns null for empty values", () => {
    expect(optionalString(undefined, "bio")).toBeNull();
    expect(optionalString("", "bio")).toBeNull();
    expect(optionalString("text", "bio")).toBe("text");
  });

  it("requireTrue only accepts literal true", () => {
    expect(requireTrue(true, "acceptTerms")).toBe(true);
    expect(() => requireTrue("yes", "acceptTerms")).toThrow(
      BadRequestException,
    );
    expect(() => requireTrue(false, "acceptTerms")).toThrow(
      BadRequestException,
    );
  });

  it("requireStringArray enforces item and count limits", () => {
    expect(requireStringArray(["English", "Hindi"], "languages")).toEqual([
      "English",
      "Hindi",
    ]);
    expect(() => requireStringArray([], "languages")).toThrow(
      BadRequestException,
    );
    expect(() =>
      requireStringArray(["a", "b"], "languages", { maxItems: 1 }),
    ).toThrow(BadRequestException);
  });

  it("requireIsoDate validates YYYY-MM-DD", () => {
    expect(requireIsoDate("1995-04-12", "dateOfBirth")).toBe("1995-04-12");
    expect(() => requireIsoDate("12/04/1995", "dateOfBirth")).toThrow(
      BadRequestException,
    );
    expect(() => requireIsoDate("not-a-date", "dateOfBirth")).toThrow(
      BadRequestException,
    );
    expect(optionalIsoDate(undefined, "dateOfBirth")).toBeNull();
  });

  it("requireRecord accepts plain objects only", () => {
    expect(requireRecord({ a: 1 }, "payoutDetails")).toEqual({ a: 1 });
    expect(() => requireRecord([], "payoutDetails")).toThrow(
      BadRequestException,
    );
    expect(() => requireRecord(null, "payoutDetails")).toThrow(
      BadRequestException,
    );
  });

  it("requireIntInRange enforces integer bounds", () => {
    expect(requireIntInRange(5, "ratePerMinute", 1, 100)).toBe(5);
    expect(() => requireIntInRange(0, "ratePerMinute", 1, 100)).toThrow(
      BadRequestException,
    );
    expect(() => requireIntInRange(5.5, "ratePerMinute", 1, 100)).toThrow(
      BadRequestException,
    );
  });
});
