import http from "http";
import dotenv from "dotenv";
import "./db/index.js";

import { WebSocketServer } from "ws";
import { middleware } from "./app.js";

dotenv.config();

const port = process.env.PORT;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const path = process.env.WEBHOOK_PATH;
const localWebhookUrl = `http://${host}:${port}${path}`;

const server = http.createServer(middleware).listen(port, () => {
  console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});

/* Creating a websocket to run on our server */
const wss = new WebSocketServer({ server }, () => {
  console.log('WSS started');
});