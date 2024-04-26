import { Schema, model } from "mongoose";
import { DocumentTypes } from '../../types/index.js';

const installationSchema = new Schema<DocumentTypes.Installation>({
  _id: { type: Schema.Types.Number, required: true },   // uses .id from GH payloads
  owner_name: { type: Schema.Types.String },            // use payload installation.account.login
  owner_id: { type: Schema.Types.Number, ref: "User" }, // use payload installation.target_id (same as installation.account.id)
  type: { type: Schema.Types.String },                  // use payload installation.target_type
  orgs_url: { type: Schema.Types.String },
  repos_url: { type: Schema.Types.String },
  repos: [ { type: Schema.Types.Number, ref: "Repository" } ] // use repo._id (not on Installation Type but IS on REST payload)
});
// TODO: move `repos` to `users.repos`

export default model<DocumentTypes.Installation>("Installation", installationSchema);
