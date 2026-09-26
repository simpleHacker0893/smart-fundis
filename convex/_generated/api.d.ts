/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assessments from "../assessments.js";
import type * as contact from "../contact.js";
import type * as fundiProfiles from "../fundiProfiles.js";
import type * as lib_assessmentUpload from "../lib/assessmentUpload.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_contact from "../lib/contact.js";
import type * as lib_counties from "../lib/counties.js";
import type * as lib_fundiProfile from "../lib/fundiProfile.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_rateLimiter from "../lib/rateLimiter.js";
import type * as lib_rubrics from "../lib/rubrics.js";
import type * as lib_showcaseLinks from "../lib/showcaseLinks.js";
import type * as lib_storage from "../lib/storage.js";
import type * as lib_tradeCatalogue from "../lib/tradeCatalogue.js";
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
  assessments: typeof assessments;
  contact: typeof contact;
  fundiProfiles: typeof fundiProfiles;
  "lib/assessmentUpload": typeof lib_assessmentUpload;
  "lib/auth": typeof lib_auth;
  "lib/contact": typeof lib_contact;
  "lib/counties": typeof lib_counties;
  "lib/fundiProfile": typeof lib_fundiProfile;
  "lib/phone": typeof lib_phone;
  "lib/rateLimiter": typeof lib_rateLimiter;
  "lib/rubrics": typeof lib_rubrics;
  "lib/showcaseLinks": typeof lib_showcaseLinks;
  "lib/storage": typeof lib_storage;
  "lib/tradeCatalogue": typeof lib_tradeCatalogue;
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
