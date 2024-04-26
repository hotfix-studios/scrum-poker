/**
 * @summary Types for all DB application layer context
 * @implements Module for Unit of Work design pattern
 */
export * as ContextTypes from "./context.js";

/**
 * @summary Types expected from GH REST
 * @implements Module like a namespace avoids naming collision with DTO module
 */
export * as OctokitTypes from "./octokit.js";

/**
 * @summary The app processes I/O data to these types/shapes for transit to/from REST and/or DB.
 * @implements These are exported in their own "DTO" module (like a namespace) to avoid naming collision from REST.
 */
export * as DTO from "./DTO.js";

/**
 * @summary These Types represent the Documents fields' datatypes and will Hydrate to include extended Mongoose prototype stuff.
 * @implements DocumentTypes module.
 */
export * as DocumentTypes from "./db.js";
