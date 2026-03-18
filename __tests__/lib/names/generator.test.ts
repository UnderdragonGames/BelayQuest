import { describe, it, expect } from "vitest";
import { generateName, NAMESPACE_SIZE } from "../../../lib/names/generator";
import { adjectives } from "../../../lib/names/adjectives";
import { nouns } from "../../../lib/names/nouns";

describe("generateName", () => {
  it("returns a two-word string", () => {
    const name = generateName();
    const words = name.split(" ");
    expect(words).toHaveLength(2);
  });

  it("first word is from adjectives list", () => {
    const name = generateName();
    const [adj] = name.split(" ");
    expect(adjectives).toContain(adj);
  });

  it("second word is from nouns list", () => {
    const name = generateName();
    const [, noun] = name.split(" ");
    expect(nouns).toContain(noun);
  });

  it("multiple calls produce valid strings", () => {
    for (let i = 0; i < 10; i++) {
      const name = generateName();
      expect(name.split(" ")).toHaveLength(2);
    }
  });
});

describe("NAMESPACE_SIZE", () => {
  it("equals adjectives.length * nouns.length", () => {
    expect(NAMESPACE_SIZE).toBe(adjectives.length * nouns.length);
  });

  it("is 2500 (50 adjectives × 50 nouns)", () => {
    expect(NAMESPACE_SIZE).toBe(2500);
  });
});
