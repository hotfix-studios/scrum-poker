import fs from "fs";
import express from "express";
// TODO: install @types/cors
import dotenv from "dotenv";
import "./db/index.js";

import { WebSocketServer } from "ws";
import { app } from "./app.js";

/* API */
import { configureServer, registerEventListeners } from "./router/index.js";

/////////////////////////////////////////////////////////
// #region ///////////////// ENV VARS ///////////////////
dotenv.config();

const port = process.env.PORT;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const webhook_path = process.env.WEBHOOK_PATH;
const environment = process.env.NODE_ENV;
const localWebhookUrl = `http://${host}:${port}`;
/////////////////////////////////////////////////////////
// #endregion ///////////////////////////////////////////

/////////////////////////////////////////////////////////
// #region ////////////// server setup //////////////////
const _express = express();

configureServer(_express);

/* returns http server to setup sockets on */
const server = _express.listen(port, () => {
  console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});

/* creating a websocket to run on our server */
// const wss = new WebSocketServer({ server }, () => {
//   console.log('WSS started');
// });

registerEventListeners(app);
/////////////////////////////////////////////////////////
// #endregion ///////////////////////////////////////////

/////////////////////////////////////////////////////////
///// #region top-level node critical-failure catch /////
process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error(`Critical failure, propagated to top-level from ${origin}, error: `, err);
  /* TODO: create custom monitor class here that will handle application recover or restart from unhandled critical failure... */
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  /* TODO: application logging, throwing an error, or other logic here for uncaught promises */
});

process.on('uncaughtException', (err, origin) => {
  const log = `Caught exception: ${err}\n` +
  `Exception origin: ${origin}\n`;
  console.error("Critical Error -- app is about to explode... \n performing synchronous cleanup.. \n writing crash state to log file..");
  fs.writeSync(
    process.stderr.fd,
    log
  );
  /* TODO: For Production, this should be replaced by Sentry or at least a hosted and isolated server for handling http/https and storing logs */
  if (environment === "development") {
    fs.appendFileSync(
      "error.log",
      `Logging to ./error.log app critical failure:\n
      ${new Date().toISOString()}\n
      ${log}\n --- \n
      \n`
    );
  }
  console.error("goodbye.");
});
/////////////////////////////////////////////////////////
// #endregion ///////////////////////////////////////////

/* TODO: all 3 of these need testing, idk where fs.writeSync outputs.. */
/* [node critical failure handling process.on docs](https://nodejs.org/api/process.html#process_event_uncaughtexception) */
