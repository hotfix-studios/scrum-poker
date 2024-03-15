import { Schema, model } from "mongoose";

const installationSchema = new Schema({
  _id: { type: Schema.Types.Number, required: true }, // uses .id from GH payloads
  type: { type: Schema.Types.String },
  orgs_url: { type: Schema.Types.String },
  repos_url: { type: Schema.Types.String },
  repos: [ { type: Schema.Types.Number, ref: "Repository" } ] // use repo._id (not on Installation Type but IS on REST payload)
});

export default model("Installation", installationSchema);
