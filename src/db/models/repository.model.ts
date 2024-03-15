import { Schema, model } from "mongoose";

const repositorySchema = new Schema({
  gh_id: { type: Schema.Types.Number, require: true },
  name: { type: Schema.Types.String, require: true },
  full_name: { type: Schema.Types.String, require: true },
  private: { type: Schema.Types.Boolean, require: true },
  owner: { type: Schema.Types.Number, require: true, ref: "User" } // use user.gh_id
});