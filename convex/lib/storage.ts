import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Is this stored file recorded anywhere in the app's tables?
 *
 * `assessments.create` deletes an uploaded file on every rejection (US-3.9),
 * even for a signed-out caller, and this check is the only thing that stops
 * it from deleting (or reusing) a file another row already owns. A file no
 * table records has no owner yet; storageIds are unguessable, so deleting it
 * is safe.
 *
 * RULE: every table that stores an `Id<"_storage">` must add its own indexed
 * check here, in the same change that adds the field (e.g. profile photos in
 * V3/V6). A missing check lets a rejected upload delete that table's files.
 */
export async function isStorageReferenced(ctx: QueryCtx, storageId: Id<"_storage">): Promise<boolean> {
  const assessment = await ctx.db
    .query("assessments")
    .withIndex("by_videoStorageId", (q) => q.eq("videoStorageId", storageId))
    .first();
  if (assessment !== null) return true;

  // Add the next table that stores a `_storage` ID here.
  return false;
}
