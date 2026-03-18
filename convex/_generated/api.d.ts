/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as avatarGenerate from "../avatarGenerate.js";
import type * as avatars from "../avatars.js";
import type * as connections from "../connections.js";
import type * as crons from "../crons.js";
import type * as guilds from "../guilds.js";
import type * as gyms from "../gyms.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as notifications from "../notifications.js";
import type * as progression from "../progression.js";
import type * as seedGyms from "../seedGyms.js";
import type * as sessions from "../sessions.js";
import type * as sms from "../sms.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  avatarGenerate: typeof avatarGenerate;
  avatars: typeof avatars;
  connections: typeof connections;
  crons: typeof crons;
  guilds: typeof guilds;
  gyms: typeof gyms;
  http: typeof http;
  inventory: typeof inventory;
  notifications: typeof notifications;
  progression: typeof progression;
  seedGyms: typeof seedGyms;
  sessions: typeof sessions;
  sms: typeof sms;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
