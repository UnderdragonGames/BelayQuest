/**
 * Shared test helpers for Convex backend tests.
 * Each helper uses t.run() to write directly to the mock DB.
 */
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { Id } from "../../convex/_generated/dataModel";

export type TestClient = ReturnType<typeof convexTest>;

/** Insert a user with sensible defaults. Returns userId. */
export async function createTestUser(
  t: TestClient,
  overrides: Partial<{
    generatedName: string;
    totalXp: number;
    level: number;
    maxGradeBoulder: string;
    maxGradeRoute: string;
    onboardingComplete: boolean;
    currentStatus: { effect: string; type: "buff" | "debuff"; expiresAt: number };
    favoriteGyms: Id<"gyms">[];
    volumePRs: Array<{ grade: string; count: number }>;
  }> = {}
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      generatedName: overrides.generatedName ?? "Test User",
      totalXp: overrides.totalXp ?? 0,
      level: overrides.level ?? 1,
      onboardingComplete: overrides.onboardingComplete ?? true,
      ...overrides,
    });
  });
}

/** Insert a gym with sensible defaults. Returns gymId. */
export async function createTestGym(
  t: TestClient,
  overrides: Partial<{
    name: string;
    city: string;
    state: string;
  }> = {}
): Promise<Id<"gyms">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("gyms", {
      name: overrides.name ?? "Test Gym",
      address: "123 Test St",
      city: overrides.city ?? "Austin",
      state: overrides.state ?? "TX",
      country: "US",
      latitude: 30.2672,
      longitude: -97.7431,
      source: "test",
      verified: true,
    });
  });
}

/** Insert a session + creator membership. Returns sessionId. */
export async function createTestSession(
  t: TestClient,
  creatorId: Id<"users">,
  gymId: Id<"gyms">,
  overrides: Partial<{
    type: "raid" | "quest";
    status: "draft" | "open" | "active" | "completed" | "dissolved";
    scheduledAt: number;
    capacity: number;
    dissolveAt: number;
  }> = {}
): Promise<Id<"sessions">> {
  return await t.run(async (ctx) => {
    const sessionId = await ctx.db.insert("sessions", {
      type: overrides.type ?? "raid",
      creatorId,
      leaderId: creatorId,
      gymId,
      scheduledAt: overrides.scheduledAt ?? Date.now() + 60 * 60 * 1000,
      status: overrides.status ?? "open",
      shortCode: "TESTCODE",
      capacity: overrides.capacity,
      dissolveAt: overrides.dissolveAt,
    });

    // Creator is automatically accepted
    await ctx.db.insert("sessionMembers", {
      sessionId,
      userId: creatorId,
      status: "accepted",
      invitedBy: creatorId,
      checkedIn: false,
    });

    return sessionId;
  });
}
