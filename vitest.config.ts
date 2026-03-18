import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/lib/**/*.test.ts", "__tests__/convex/**/*.test.ts"],
    environment: "edge-runtime",
    passWithNoTests: true,
  },
});
