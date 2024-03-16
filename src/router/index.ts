import { Application, Request, Response, Router, json } from "express";


/* TYPES */
import { App as AppType } from "octokit";

// import * as octokitApi from "./octokit.router.js";
import { octokitApi } from "../api/octokit.js";

export const api = Router();

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
  // Installation
  octokitClient.webhooks.on("installation.created", octokitApi.getInstallation);
  // Issues
  octokitClient.webhooks.on("issues.opened", octokitApi.issueOpenedHandler);
  // PRs
  octokitClient.webhooks.on("pull_request.opened", octokitApi.pullRequestOpenedHandler);
  // Errors
  octokitClient.webhooks.onError(octokitApi.wildCardErrorHandler);
};

// TODO: check out if this is good:
// app.webhooks.verify