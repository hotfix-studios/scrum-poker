import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: { type: Schema.Types.String, required: true },
  node_id: { type: Schema.Types.String, unique: true },
  avatar_url: { type: Schema.Types.String, required: true },
  game_host: { type: Schema.Types.Boolean, default: false }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("User", userSchema);
