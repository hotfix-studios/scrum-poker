import { Schema, model } from "mongoose";
import { DocumentTypes } from '../../types/index.js';

const repositorySchema = new Schema<DocumentTypes.Repository>({
  _id: { type: Schema.Types.Number, required: true },                // uses .id from GH payloads
  name: { type: Schema.Types.String, required: true },
  full_name: { type: Schema.Types.String, required: true },
  is_private: { type: Schema.Types.Boolean, required: true },
  owner_id: { type: Schema.Types.Number, required: true, ref: "User", default: 0 }, // use user._id (not available on installation payload)
  description: { type: Schema.Types.String, default: "" },
  url: { type: Schema.Types.String, default: "" },
  collaborators_url: { type: Schema.Types.String, default: "" },
  teams_url: { type: Schema.Types.String, default: "" },
  assignees_url: { type: Schema.Types.String, default: "" },
  contributors_url: { type: Schema.Types.String, default: "" },
  comments_url: { type: Schema.Types.String, default: "" },
  issue_comment_url: { type: Schema.Types.String, default: "" },
  issues_url: { type: Schema.Types.String, default: "" },
  labels_url: { type: Schema.Types.String, default: "" },
  clone_url: { type: Schema.Types.String, default: "" },
  language: { type: Schema.Types.String, default: "" },
  has_issues: { type: Schema.Types.Boolean, default: false },
  has_projects: { type: Schema.Types.Boolean, default: false },
  open_issues_count: { type: Schema.Types.Number, default: 0 },
  has_backlog: { type: Schema.Types.Boolean, default: false },
  has_pointed: { type: Schema.Types.Boolean, default: false }
});

export default model<DocumentTypes.Repository>("Repository", repositorySchema);
