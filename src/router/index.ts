import express from "express";

/* TYPES */
import { App as AppType } from "octokit";

import * as webhookApi from "./webhooks.router.js";

const api = express.Router();

/**
 * This sets up the event listeners (like webhook).
 * E.g.: when the app receives a webhook event (POST?) from GitHub with a `X-GitHub-Event` header value of `pull_request`
 * and an `action` payload value of `opened`, it calls the `pullRequestOpenedHandler`
 */
export const registerEventListeners = (octokitClient: AppType) => {
  /************
   * WEBHOOKS *
   ***********/
  // Issues
  octokitClient.webhooks.on("issues.opened", webhookApi.issueOpenedHandler);
  // PRs
  octokitClient.webhooks.on("pull_request.opened", webhookApi.pullRequestOpenedHandler);
  // Errors
  octokitClient.webhooks.onError(webhookApi.wildCardErrorHandler);
};

// TODO: check out if this is good:
// app.webhooks.verify
