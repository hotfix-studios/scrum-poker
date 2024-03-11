import { Application, Request, Response, Router, json } from "express";


/* TYPES */
import { App as AppType } from "octokit";

import * as webhookApi from "./webhooks.router.js";

const api = Router();

export const configureServer = (server: Application) => {
  server
    .get("/", (req, res) => {
      res.send("Placeholder")
    })
    .use(json());
    // TODO: should have error handling: [example](https://github.com/covalence-io/ws-simple/blob/main/routers/index.ts)
};

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
