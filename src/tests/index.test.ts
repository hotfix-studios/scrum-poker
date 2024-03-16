import { randomBytes } from "crypto";
import { User, Room } from "../db/models/index.js";

import dotenv from "dotenv";
import mongoose from "mongoose";

console.log("ensure models are importing correctly:", User);

/** ***************** **
 * ******************* *
 * ** MOCK DB SETUP * **
 * ******************* *
 ** ***************** **/

dotenv.config();

/* still connects to dev db... */
const mongoUri: string | undefined = process.env.DB_CONNECTION;
console.log(mongoUri);

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
 ** * * DB TESTS * * **
 * ******************* *
 ** ***************** **/

const roomId = randomBytes(4).toString("base64").slice(0, 5);
console.log("ROOM ID FROM BYTES:", roomId);
const userHost = 1234;
const userPlayer = 5678;

try {
  const doc = await Room.create({ _id: roomId, users: userHost });
  console.log(doc);
} catch (error) {
  console.error("First Insert Failed", error);
}

try {
  const docTwo = await Room.findOne( { _id: roomId });
  docTwo.users.push(userPlayer);
  console.log("SECOND INSERT SUCCESS:", docTwo);
  await docTwo.save();
} catch (error) {
  console.error("Second Insert Failed", error);
}