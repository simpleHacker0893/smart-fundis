/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as contact from "../contact.js";
import type * as fundiProfiles from "../fundiProfiles.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_contact from "../lib/contact.js";
import type * as lib_counties from "../lib/counties.js";
import type * as lib_fundiProfile from "../lib/fundiProfile.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_rateLimiter from "../lib/rateLimiter.js";
import type * as lib_trades from "../lib/trades.js";
import type * as lib_validators from "../lib/validators.js";
import type * as seed from "../seed.js";
import type * as trades from "../trades.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  contact: typeof contact;
  fundiProfiles: typeof fundiProfiles;
  "lib/auth": typeof lib_auth;
  "lib/contact": typeof lib_contact;
  "lib/counties": typeof lib_counties;
  "lib/fundiProfile": typeof lib_fundiProfile;
  "lib/phone": typeof lib_phone;
  "lib/rateLimiter": typeof lib_rateLimiter;
  "lib/trades": typeof lib_trades;
  "lib/validators": typeof lib_validators;
  seed: typeof seed;
  trades: typeof trades;
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

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
