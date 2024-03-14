import { Schema, model } from "mongoose";


const roomSchema = new Schema({
  _id: { type: Schema.Types.String, required: true },
  host: { type: Schema.Types.String, unique: true },
  users: [ { type: Schema.Types.String } ]
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
export default model("Room", roomSchema);
