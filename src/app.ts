import dotenv from "dotenv";
import "./db/index.js";

// import fs from "fs";
import http from "http";

import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";

/* Types */
import { App as AppType } from "octokit";
// import { Issue } from "./types/octokit.js";
import * as OctokitTypes from './types/octokit.js';

dotenv.config();

const appId = process.env.APP_ID;
const installationId = process.env.INSTALLATION_ID;
const webhookSecret = process.env.WEBHOOK_SECRET;

/* Less safe, local pvt key workflow option */
// const privateKeyPath = process.env.PRIVATE_KEY_PATH;
// const privateKey = fs.readFileSync(privateKeyPath, "utf-8");

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
 * This adds an event handler that your code will call later.
 * When this event handler is called, it will log the event to the console.
 * Then, it will use GitHub's REST API to add a comment to the pull request that triggered the event.
 */
const handlePullRequestOpened = async ({octokit, payload}) => {
  console.log(`Received a pull request event for #${payload.pull_request.number}`);
  // TODO: LOG PAYLOAD HERE
  try {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: "Thanks for opening a new PR!",
      headers: {
        "x-github-api-version": "2022-11-28",
        // "content-type": "application/json", // might not need, possibly default
        "x-accepted-github-permissions": true // this header as well to get a response of all required permissions for the GH API request!
      },
    });
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    }
    console.error(error)
  }
};

/**
 * This sets up a webhook event listener. When your app receives a webhook event from GitHub with a `X-GitHub-Event`
 * header value of `pull_request` and an `action` payload value of `opened`, it calls the `handlePullRequestOpened`
 * event handler that is defined above.
 */
app.webhooks.on("pull_request.opened", handlePullRequestOpened);

// TODO: check out if this is good:
// app.webhooks.verify

app.webhooks.on("issues.opened", ({ octokit, payload }) => {
  console.log("ISSUE OPENED:", payload);

  const { repository, issue }: { repository: OctokitTypes.Repository, issue: OctokitTypes.Issue } = payload;
  const owner = repository.owner.login;
  const repo = repository.name;
  const issueNumber = issue.number;

  return octokit.rest.issues.createComment({
    owner: owner,
    repo: repo,
    issue_number: issueNumber,
    body: "Hello, World!",
  });
});

// This logs any errors that occur.
app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});

/**
 * For local development, your server will listen to port 3000 on `localhost`.
 * When you deploy your app, you will change these values. For more information,
 * see "[Deploy your app](https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-github-app-that-responds-to-webhook-events#deploy-your-app)."
 */
const port = process.env.PORT;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const path = process.env.WEBHOOK_PATH;
const localWebhookUrl = `http://${host}:${port}${path}`;

/**
 * This sets up a middleware function to handle incoming webhook events.
 * Octokit's `createNodeMiddleware` function takes care of generating this middleware function for you. The resulting middleware function will:
 * - Check the signature of the incoming webhook event to make sure that it matches your webhook secret.
 *   This verifies that the incoming webhook event is a valid GitHub event.
 * - Parse the webhook event payload and identify the type of event.
 * - Trigger the corresponding webhook event handler.
 */
const middleware = createNodeMiddleware(app.webhooks, {path});

/**
 * This creates a Node.js server that listens for incoming HTTP requests (including webhook payloads from GitHub) on the specified port.
 * When the server receives a request, it executes the `middleware` function that you defined earlier.
 * Once the server is running, it logs messages to the console to indicate that it is listening.
 */
http.createServer(middleware).listen(port, () => {
  console.log("\x1b[34m", `Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});
