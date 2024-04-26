import { Schema, model } from "mongoose";
import { DocumentTypes } from '../../types/index.js';

const roomSchema = new Schema<DocumentTypes.Room>({
  _id: { type: Schema.Types.String, required: true },             // crypto randomBytes(4).toString("base64").slice(0, 5);
  host: { type: Schema.Types.Number, ref: "User", unique: true }, // uses users[0] (user._id)
  users: [ { type: Schema.Types.Number, ref: "User" } ]           // use user._id (lookup User by _id for name)
},
{
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  optimisticConcurrency: true
});

// Pre-save middleware to ensure users is always an array
roomSchema.pre("save", function(next) {
  if (!Array.isArray(this.users)) {
    this.users = [this.users]; // Convert to array if not already
  }
  next();
});

// Pre-save middleware to set host based on _id
roomSchema.pre("save", function(next) {
  if (!this.host) {
    this.host = this.users[0];
  }
  next();
});


/**
 * @summary const rooms = await Room.find().lean();
 * Use lean() to get plain JS objects instead of Mongoose documents
 */
export default model<DocumentTypes.Room>("Room", roomSchema);
