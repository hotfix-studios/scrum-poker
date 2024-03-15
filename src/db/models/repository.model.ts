import { Schema, model } from "mongoose";

const repositorySchema = new Schema({
  gh_id: { type: Schema.Types.Number, required: true },
  name: { type: Schema.Types.String, required: true },
  full_name: { type: Schema.Types.String, required: true },
  private: { type: Schema.Types.Boolean, required: true },
  owner: { type: Schema.Types.Number, required: true, ref: "User" } // use user.gh_id
});