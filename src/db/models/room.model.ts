import { Schema, model } from "mongoose";

const roomSchema = new Schema({
  _id: { type: Schema.Types.String, required: true, unique: true },
  users: [ { type: Schema.Types.String } ]
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

/**
 * @summary const rooms = await Room.find().lean();
 * Use lean() to get plain JS objects instead of Mongoose documents
 */
export default model("Room", roomSchema);
