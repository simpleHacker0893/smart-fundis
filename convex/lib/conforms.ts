import type { GenericValidator } from "convex/values";

/**
 * Whether untrusted JSON (an HTTP body) matches a Convex validator, the same
 * way argument validation would: required fields present, no extra fields,
 * finite numbers. Lets an HTTP action answer 400 before calling a mutation,
 * with the validator as the one definition of the shape.
 */
export function conforms<V extends GenericValidator>(validator: V, value: unknown): value is V["type"] {
  // A generic V doesn't narrow on `kind`; the widened union does.
  const val: GenericValidator = validator;
  switch (val.kind) {
    case "string":
    case "id":
      return typeof value === "string";
    case "float64":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    case "literal":
      return value === val.value;
    case "array":
      return Array.isArray(value) && value.every((element) => conforms(val.element, element));
    case "union":
      return val.members.some((member) => conforms(member, value));
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
      }
      const record = value as Record<string, unknown>;
      // Object.hasOwn, not `in`: `in` also finds an inherited key like
      // "toString" or "constructor" on val.fields (a plain object), which
      // would let a body carrying that key slip past this check.
      if (Object.keys(record).some((key) => !Object.hasOwn(val.fields, key))) {
        return false;
      }
      return Object.entries(val.fields).every(([key, field]) =>
        record[key] === undefined ? field.isOptional === "optional" : conforms(field, record[key]),
      );
    }
    default:
      return false;
  }
}
