import path from "path";
import { Application, Request, Response, Router, json, urlencoded } from "express";
import { middleware } from "../app.js";
import cors from "cors";

/* TYPES */
import { App as AppType } from "octokit";
import { octokitApi } from "../api/index.js";

// TODO: Move to user.router.ts (create user router) (move express router there and import here...)
import { userController } from "../db/controllers/index.js";

export const api = Router();

// TODO: add session middleware for user id/key lookup (to get Installation ID?)
/* installation.owner_id, installation.owner_name, installation._id */

export const configureServer = (server: Application) => {
  server
    .use(cors())
    .use(json())
    .use(urlencoded({ extended: true }))
    .use(middleware)
    .use("/api", api) // TODO: figure out why /api/ url was working...
    .get("/", (req, res) => {
      res.sendFile("/webgl/index.html", { root: "dist" })
    })
    .post("/session", async (req, res) => {
      const name = req.body;
      console.log("REQ:", name);

      const document = await userController.findOne(name);
      console.log(document);
      res.status(201).send(document);
      // res.sendStatus(200);
      // res.send("<h1>SESSION CREATED</h1>");
    });
};

    // TODO: Host webGl build on site "Homepage" in GH GUI (on static homepage button redirects to GH Marketplace Install trigger auth flow)
    // TODO: Node Endpoint to handle "Auth" from GH App installation Redirect (middleware)
    // // --> endpoint in app/server --> token/session on res (write middleware to get req.GITHUB_ID (create session?))
    // // // --> IF app authenticates on behalf of users this will be users gh_id, ELSE it will be installation (user?) owner_id
    // TODO: redirect to GAME: http://127.0.0.1:5500/dist/webgl/index.html (GH Callback URL) (maybe GH Setup URL?)
    // // --> URL might be http://127.0.0.1:3000 instead? (hits .get("/"))

    // TODO: should have error handling: [example](https://github.com/covalence-io/ws-simple/blob/main/routers/index.ts)

/**
 * This sets up the event listeners (like webhook).
 * E.g.: when the app receives a webhook event (POST?) from GitHub with a `X-GitHub-Event` header value of `pull_request`
 * and an `action` payload value of `opened`, it calls the `pullRequestOpenedHandler`
 */
export const registerEventListeners = (octokitClient: AppType) => {
  // Installation
  octokitClient.webhooks.on("installation.created", octokitApi.getInstallation);
  octokitClient.webhooks.on("installation.created", octokitApi.getAndWriteInstallationRepos);
  octokitClient.webhooks.on("installation.created", octokitApi.setOwnerUser);
  // Repos
  octokitClient.webhooks.on("repository.created", octokitApi.handleRepoCreate); // event not working
  // Issues
  octokitClient.webhooks.on("issues.opened", octokitApi.issueOpenedHandler);
  // TODO: assign points to Issue
  // TODO: grab and move Issue from Backlog to In Progress lane
  // PRs
  octokitClient.webhooks.on("pull_request.opened", octokitApi.pullRequestOpenedHandler);
  // Errors
  octokitClient.webhooks.onError(octokitApi.wildCardErrorHandler);
};

// TODO: check out if this is good:
// app.webhooks.verify
