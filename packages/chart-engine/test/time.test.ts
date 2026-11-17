import { describe, expect, it } from "vitest";

import { parseTimestamp } from "../src";

const EPOCH_2024 = 1704067200; // 2024-01-01T00:00:00Z

describe("parseTimestamp", () => {
  it("parses ISO strings with an explicit Z as UTC", () => {
    expect(parseTimestamp("2024-01-01T00:00:00Z", "auto")).toBe(EPOCH_2024);
  });

  it("parses a zone-less date-time as UTC (deterministic across machines)", () => {
    expect(parseTimestamp("2024-01-01 00:00:00", "auto")).toBe(EPOCH_2024);
  });

  it("parses a date-only value as UTC midnight", () => {
    expect(parseTimestamp("2024-01-01", "auto")).toBe(EPOCH_2024);
  });

  it("parses UNIX seconds and milliseconds", () => {
    expect(parseTimestamp(EPOCH_2024, "auto")).toBe(EPOCH_2024);
    expect(parseTimestamp(EPOCH_2024 * 1000, "auto")).toBe(EPOCH_2024);
  });

  it("parses Date objects", () => {
    expect(parseTimestamp(new Date("2024-01-01T00:00:00Z"), "auto")).toBe(
      EPOCH_2024,
    );
  });

  it("parses Excel serial dates", () => {
    expect(parseTimestamp(45292, "excel")).toBe(EPOCH_2024);
    expect(parseTimestamp(45292, "auto")).toBe(EPOCH_2024);
  });

  it("honours an explicit unix_ms format", () => {
    expect(parseTimestamp(EPOCH_2024 * 1000, "unix_ms")).toBe(EPOCH_2024);
  });

  it("returns null for unparseable input", () => {
    expect(parseTimestamp("not a date", "auto")).toBeNull();
    expect(parseTimestamp("", "auto")).toBeNull();
  });

  it("rejects locale-ambiguous date shapes instead of guessing", () => {
    expect(parseTimestamp("01/02/2024", "auto")).toBeNull();
    expect(parseTimestamp("5 Jan 2024", "auto")).toBeNull();
    expect(parseTimestamp("Jan 5, 2024 09:15", "auto")).toBeNull();
  });

  it("honours explicit numeric zone offsets, with or without a colon", () => {
    expect(parseTimestamp("2024-01-01T05:30:00+05:30", "auto")).toBe(
      EPOCH_2024,
    );
    expect(parseTimestamp("2024-01-01 05:30:00+0530", "auto")).toBe(
      EPOCH_2024,
    );
  });
});
