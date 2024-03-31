import dotenv from "dotenv";
// TODO: db require has been moved to server kick off... test when CRUD setup
import "./db/index.js";

import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";

/* Types */
import { App as AppType } from "octokit";

dotenv.config();

const appId = process.env.APP_ID;
// TODO: is installationId still being used (hardcoded??)
export const installationId = Number(process.env.INSTALLATION_ID);
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
/* OAuth App Class */
// const app: AppType = new App({
//   clientType: "github-app",
//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
// });

/**
 * This sets up a middleware function to handle incoming webhook events.
 * Octokit's `createNodeMiddleware` function takes care of generating this middleware function for you. The resulting middleware function will:
 * - Check the signature of the incoming webhook event to make sure that it matches your webhook secret.
 *   This verifies that the incoming webhook event is a valid GitHub event.
 * - Parse the webhook event payload and identify the type of event.
 * - Trigger the corresponding webhook event handler.
 */
const middleware = createNodeMiddleware(app.webhooks, { path });
// TODO: pass just app top above instead of app.webhooks?

export { app, /* server,  wss, */ middleware };
