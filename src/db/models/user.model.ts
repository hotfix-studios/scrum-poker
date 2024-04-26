import { Schema, model } from "mongoose";
import { DocumentTypes } from '../../types/index.js';

const userSchema = new Schema<DocumentTypes.User>({
  _id: { type: Schema.Types.Number, required: true }, // use .id from GH payloads
  type: { type: Schema.Types.String, required: true },
  name: { type: Schema.Types.String, required: true },
  avatar_url: { type: Schema.Types.String, required: true },
  repos_url: { type: Schema.Types.String, required: true },
  repos: { type: [Schema.Types.Number], default: [], ref: "Repository" }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model<DocumentTypes.User>("User", userSchema);
