import { randomBytes } from "crypto";
import User from "./user.model.js";
import Room from "./room.model.js";

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoUri: string | undefined = process.env.DB_CONNECTION;

console.log(mongoUri);
console.log(User);

if (mongoUri != undefined) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("\x1b[36m%s\x1b[0m", "Connected to Cloud DB");
    })
    .catch((err) => {
      console.error("\x1b[31m%s\x1b[0m", "Failed to connect to Cloud DB", err);
    });
} else {
  console.error("\x1b[31m%s\x1b[0m", "Mongo Cloud DB Connection string is undefined");
}


/** ***************** **
 * ******************* *
 *  Export Models Hub  *
 * ******************* *
 ** ***************** **/

const roomId = randomBytes(3).toString("base64").slice(0, 5);
console.log("ROOM ID FROM BYTES:", roomId);
const userHost = "Dummy Testy";
const userPlayer = "Dum Dum 2";

try {
  const doc = await Room.create({ room_id: roomId, users: userHost });
  console.log(doc);
} catch (error) {
  console.error("First Insert Failed", error);
}

try {
  const docTwo = await Room.findOne( { room_id: roomId });
  docTwo.users.push(userPlayer);
  console.log("SECOND INSERT SUCCESS:", docTwo);
  await docTwo.save();
} catch (error) {
  console.error("Second Insert Failed", error);
}

export { User };

// { useNewUrlParser: true, useUnifiedTopology: true }

/* Mongo Change Streams Implementation:
async function run() {
  // Create a new mongoose model
  const personSchema = new mongoose.Schema({
    name: String
  });
  const Person = mongoose.model('Person', personSchema);

  // Create a change stream. The 'change' event gets emitted when there's a
  // change in the database
  Person.watch().
    on('change', data => console.log(new Date(), data));

  // Insert a doc, will trigger the change stream handler above
  console.log(new Date(), 'Inserting doc');
  await Person.create({ name: 'Axl Rose' });
}
[Docs Example](https://thecodebarbarian.com/a-nodejs-perspective-on-mongodb-36-change-streams.html#change-streams-in-mongoose)
*/
