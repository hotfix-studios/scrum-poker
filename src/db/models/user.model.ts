import { Schema, model } from "mongoose";

const userSchema = new Schema({
  _id: { type: Schema.Types.Number, required: true }, // use .id from GH payloads
  type: { type: Schema.Types.String, required: true },
  name: { type: Schema.Types.String, required: true },
  avatar_url: { type: Schema.Types.String, required: true },
  game_host: { type: Schema.Types.Boolean, default: false },
  app_owner: { type: Schema.Types.Boolean, default: false },
  associated_users: [
    {
      _id: { type: Schema.Types.Number, ref: "User" },
      name: { type: Schema.Types.String },
      avatar_url: { type: Schema.Types.String }
    }
  ]
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("User", userSchema);
