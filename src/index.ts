import http from "http";
import express from "express";
import dotenv from "dotenv";
import "./db/index.js";

import { WebSocketServer } from "ws";
import { app, middleware } from "./app.js";

/* API */
import { api, configureServer, registerEventListeners } from "./router/index.js";

/* ENV VARS */
dotenv.config();

const port = process.env.PORT;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const path = process.env.WEBHOOK_PATH;
const localWebhookUrl = `http://${host}:${port}${path}`;

/* SERVER SETUP */
const _express = express();

_express.use(middleware);
_express.use("/api", api);

// const server = http.createServer(_express);

configureServer(_express);

registerEventListeners(app);

/* returns http server to setup sockets on */
const server = _express.listen(port, () => {
  console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});

/* creating a websocket to run on our server */
const wss = new WebSocketServer({ server }, () => {
  console.log('WSS started');
});