import { Schema, model } from "mongoose";

const repositorySchema = new Schema({
  _id: { type: Schema.Types.Number, required: true },                // uses .id from GH payloads
  name: { type: Schema.Types.String, required: true },
  full_name: { type: Schema.Types.String, required: true },
  private: { type: Schema.Types.Boolean, required: true },
  owner: { type: Schema.Types.Number, required: true, ref: "User" }, // use user.gh_id (not available on installation payload)
  description: { type: Schema.Types.String },
  url: { type: Schema.Types.String },
  collaborators_url: { type: Schema.Types.String },
  teams_url: { type: Schema.Types.String },
  hooks_url: { type: Schema.Types.String },
  issue_events_url: { type: Schema.Types.String },
  events_url: { type: Schema.Types.String },
  assignees_url: { type: Schema.Types.String },
  languages_url: { type: Schema.Types.String },
  contributors_url: { type: Schema.Types.String },
  comments_url: { type: Schema.Types.String },
  issues_comment_url: { type: Schema.Types.String },
  contents_url: { type: Schema.Types.String },
  issues_url: { type: Schema.Types.String },
  labels_url: { type: Schema.Types.String },
  clone_url: { type: Schema.Types.String },
  has_issues: { type: Schema.Types.Boolean },
  has_projects: { type: Schema.Types.Boolean },
  open_issues_count: { type: Schema.Types.Number }
});

export default model("Repository", repositorySchema);
