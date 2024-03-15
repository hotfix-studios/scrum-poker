import { Schema, model } from "mongoose";

const installationSchema = new Schema({
  gh_id: { type: Schema.Types.Number, required: true },
  type: { type: Schema.Types.String },
  orgs_url: { type: Schema.Types.String },
  repos_url: { type: Schema.Types.String }
});