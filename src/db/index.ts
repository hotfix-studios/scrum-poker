import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoUri: string | undefined = process.env.DB_CONNECTION;

console.log("CONNECTION STRING:", mongoUri);

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
