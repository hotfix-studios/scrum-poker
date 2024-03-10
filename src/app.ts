import dotenv from "dotenv";
import "./db/index.js";

import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";

/* Types */
import { App as AppType } from "octokit";

dotenv.config();

const appId = process.env.APP_ID;
const installationId = process.env.INSTALLATION_ID;
const webhookSecret = process.env.WEBHOOK_SECRET;
const path = process.env.WEBHOOK_PATH;

const privateKey = Buffer
  .from(process.env.PRIVATE_KEY, "base64")
  .toString("ascii");

/* Octokit App Class */
const app: AppType = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret
  },
});

/**
 * This sets up a middleware function to handle incoming webhook events.
 * Octokit's `createNodeMiddleware` function takes care of generating this middleware function for you. The resulting middleware function will:
 * - Check the signature of the incoming webhook event to make sure that it matches your webhook secret.
 *   This verifies that the incoming webhook event is a valid GitHub event.
 * - Parse the webhook event payload and identify the type of event.
 * - Trigger the corresponding webhook event handler.
 */
const middleware = createNodeMiddleware(app.webhooks, {path});

export { app, /* server,  wss, */ middleware };
