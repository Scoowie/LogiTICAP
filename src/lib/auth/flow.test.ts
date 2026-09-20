import { describe, expect, it } from "vitest";
import { safeNextPath } from "./flow";

describe("authentication flow helpers", () => {
  it("allows only same-origin relative destinations", () => {
    expect(safeNextPath("/portal/booking?event=one#slots")).toBe(
      "/portal/booking?event=one#slots",
    );
    expect(safeNextPath("//attacker.example/path")).toBe("/portal");
    expect(safeNextPath("https://attacker.example/path")).toBe("/portal");
    expect(safeNextPath("not-a-path")).toBe("/portal");
  });
});
