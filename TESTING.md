# Testing Guide

## Architecture

BelayQuest uses **two test runners** targeting different layers:

| Runner | Command | Scope |
|--------|---------|-------|
| **Vitest** | `npm run test:convex` | Pure functions (`lib/`) + Convex backend (`convex/`) |
| **Jest** (jest-expo) | `npm run test:components` | React Native components (`components/`) |
| **Both** | `npm test` | Full suite |

**Rationale:** Vitest runs in `edge-runtime` which matches the Convex server environment. Jest with jest-expo provides the React Native JSDOM environment needed for component rendering. Mixing them in one runner causes environment conflicts.

## Directory Structure

```
__tests__/
├── lib/
│   ├── xp/calculator.test.ts      # XP formulas (Vitest)
│   └── grades/parser.test.ts      # Grade parsing (Vitest)
├── convex/
│   ├── _helpers.ts                # Factory functions for test data
│   ├── sessions.test.ts           # Session mutations/queries (Vitest)
│   └── progression.test.ts        # XP/achievement logic (Vitest)
└── components/
    ├── XpBar.test.tsx             # Progress bar (Jest)
    ├── ParchmentPanel.test.tsx    # Container panel (Jest)
    ├── StoneButton.test.tsx       # Button (Jest)
    ├── SectionHeader.test.tsx     # Header banner (Jest)
    └── PixelIcon.test.tsx         # Icon renderer (Jest)
```

Mirror the source structure: `lib/xp/calculator.ts` → `__tests__/lib/xp/calculator.test.ts`.

## Running Tests

```sh
npm test               # full suite (Vitest + Jest)
npm run test:convex    # Vitest only (lib + convex)
npm run test:components # Jest only (components)
```

## Adding Tests

### Pure Function Tests (Vitest)

Place in `__tests__/lib/<module>/`. Use data-driven tables for exhaustive coverage:

```typescript
const cases = [
  { input: 0, expected: 0 },
  { input: 100, expected: 1 },
] as const;

it.each(cases)("xpToLevel($input) = $expected", ({ input, expected }) => {
  expect(xpToLevel(input)).toBe(expected);
});
```

### Convex Backend Tests (Vitest + convex-test)

Place in `__tests__/convex/`. Use the shared helpers in `_helpers.ts`:

```typescript
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { makeTestUser } from "./_helpers";

it("does the thing", async () => {
  const t = convexTest(schema);
  const userId = await t.run(async (ctx) => makeTestUser(ctx));
  // ...
});
```

### Component Tests (Jest + RNTL)

Place in `__tests__/components/`. Use React Native Testing Library:

```tsx
import { render, screen, fireEvent } from "@testing-library/react-native";

it("fires onPress", () => {
  const onPress = jest.fn();
  render(<StoneButton label="Go" onPress={onPress} />);
  fireEvent.press(screen.getByText("Go"));
  expect(onPress).toHaveBeenCalled();
});
```

## Patterns

- **Data-driven tests** — use `it.each()` for tables of inputs/outputs
- **Explicit names** — describe what happens: `"xpForGrade('5.10a') returns 50"`, not `"works"`
- **No snapshots** — snapshots are brittle; test behavior explicitly
- **Shared helpers** — factory functions in `_helpers.ts` for Convex tests
- **No mocking internals** — test public APIs, not implementation details

## Jest Configuration Notes

`jest.config.js` mocks `expo/src/winter/runtime` to prevent Expo 55's winter runtime from installing lazy getters (for `structuredClone`, `URL`, etc.) that conflict with Jest's module scope. Node.js 17+ provides these natively. Don't remove this mock.

## CI

Both runners exit with non-zero on failure. `npm test` is the canonical CI command.
