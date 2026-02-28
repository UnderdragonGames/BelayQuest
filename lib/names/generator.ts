import { adjectives } from "./adjectives";
import { nouns } from "./nouns";

/**
 * Generate a random climbing name like "Chalk Gecko" or "Feral Sphinx".
 * Does NOT check uniqueness — caller must verify against the database.
 */
export function generateName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

/**
 * Total possible unique names with current word lists.
 */
export const NAMESPACE_SIZE = adjectives.length * nouns.length;
