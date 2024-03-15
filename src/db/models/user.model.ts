import { Schema, model } from "mongoose";

const userSchema = new Schema({
  _id: { type: Schema.Types.Number, required: true }, // uses .id from GH payloads
  type: { type: Schema.Types.String, required: true },
  name: { type: Schema.Types.String, required: true },
  avatar_url: { type: Schema.Types.String, required: true },
  game_host: { type: Schema.Types.Boolean, default: false }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("User", userSchema);
