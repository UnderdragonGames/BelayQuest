module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/components/**/*.test.{ts,tsx}"],
  passWithNoTests: true,
  setupFiles: ["./__tests__/jest.setup.js"],
  moduleNameMapper: {
    // Prevent expo's winter runtime from replacing Node.js built-ins with lazy getters.
    // Those getters call require() outside Jest's isInsideTestCode scope → "outside of scope" error.
    "expo/src/winter/runtime": "<rootDir>/__tests__/__mocks__/empty.js",
    "^@/(.*)$": "<rootDir>/$1",
  },
};
