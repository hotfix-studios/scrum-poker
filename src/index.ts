// import http from "http";
import express from "express";
import dotenv from "dotenv";
import "./db/index.js";

import { WebSocketServer } from "ws";
import { app, middleware } from "./app.js";

/* API */
import { registerEventListeners } from "./router/index.js";

dotenv.config();

const port = process.env.PORT;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const path = process.env.WEBHOOK_PATH;
const localWebhookUrl = `http://${host}:${port}${path}`;

// const server = http.createServer(middleware).listen(port, () => {
//   console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
//   console.log("Press Ctrl + C to quit.");
// });

const server = express();

server.use(middleware);

server.listen(port, () => {
  console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});

// app.webhooks.on("issues.opened", webhookApi.issueOpenedHandler);
registerEventListeners(app);

/* Creating a websocket to run on our server */
// TODO: refactor wss for Express server...
// const wss = new WebSocketServer({ server }, () => {
//   console.log('WSS started');
// });