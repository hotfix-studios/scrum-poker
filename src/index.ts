import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cron from "cron";
import express from "express";
// TODO: install @types/cors
import dotenv from "dotenv";
import "./db/index.js";

import { app } from "./app.js";

import { configureServer, registerEventListeners } from "./router/index.js";

/////////////////////////////////////////////////////////
// #region ///////////////// ENV VARS ///////////////////
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const server = _express.listen(port, () => {
  console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});

registerEventListeners(app);

// Define a cron job that runs every day at midnight
const job = new cron.CronJob("0 0 * * *", () => {
  const errorLogFilePath = path.resolve(__dirname, "..", "error.log");

  // Truncate the error log file to empty it
  fs.truncate(errorLogFilePath, 0, (err) => {
    if (err) {
      console.error("Error truncating error.log file:", err);
    } else {
      console.log("Disk error.log file has been cleaned out.");
    }
  });
});

job.start();
/////////////////////////////////////////////////////////
// #endregion ///////////////////////////////////////////

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

/* TODO: top 2 of these error listeners need testing */
/////////////////////////////////////////////////////////
// #region //// main node critical-failure catch ////////
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
  /* TODO: For Production, this should be replaced by Sentry? currently on S3.. file needs to be pruned on CRON job, otherwise infinitely expands for logs */
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
/*
 * [node critical failure handling process.on docs]
 * (https://nodejs.org/api/process.html#process_event_uncaughtexception)
*/
/////////////////////////////////////////////////////////
// #endregion ///////////////////////////////////////////
