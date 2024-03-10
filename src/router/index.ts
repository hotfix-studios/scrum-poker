import express from "express";

/* TYPES */
import { App as AppType } from "octokit";

import * as webhookApi from "./webhooks.router.js";

const api = express.Router();

export const registerEventListeners = (octokitClient: AppType) => {
  octokitClient.webhooks.on("issues.opened", webhookApi.issueOpenedHandler);
};

export { webhookApi };
