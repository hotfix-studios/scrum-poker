import { Schema, model } from "mongoose";

const userSchema = new Schema({
  gh_id: { type: Schema.Types.Number, unique: true },
  type: { type: Schema.Types.String, require: true },
  name: { type: Schema.Types.String, required: true },
  avatar_url: { type: Schema.Types.String, required: true },
  game_host: { type: Schema.Types.Boolean, default: false }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("User", userSchema);
