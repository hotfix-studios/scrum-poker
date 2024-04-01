import { Application, Request, Response, Router, json, urlencoded, static as Static } from "express";
import { middleware } from "../app.js";
import { fileURLToPath } from 'url';
import path from "path";
import cors from "cors";

/* API ROUTERS */
/* TODO: these should be importing on a single object */
import issuesRouter from "./issues.router.js";
import repositoriesRouter from "./repositories.router.js";
import usersRouter from "./users.router.js";

/* TYPES */
import { App as AppType } from "octokit";
import { octokitApi } from "../api/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const api = Router();

api.use("/issues", issuesRouter);
api.use("/repos", repositoriesRouter);
api.use("/users", usersRouter);

export const configureServer = (server: Application) => {
    /* Global Middleware */
    server
        .use(middleware)
        .use(cors())
        .use(json())
        .use(urlencoded({ extended: true }));

    /* Serve all static js, css, html, gz files from unity dist/webgl and sub-folders */
    server.use(Static(path.resolve(__dirname, "..", "webgl")));

    /* All api routes */
    server
        .use(httpLogger)
        .use("/api", api); // TODO: figure out why /api/ url was working... this might need to go up near use middleware

    server.get("/", (req, res) => {
        res.sendFile("/webgl/index.html", { root: "dist" });
    });

    /* Fallback 404 not found error handling */
    server.use((req, res) => {
        res.status(404).send('Not Found');
    });

};

    // TODO: Host webGl build on site "Homepage" in GH GUI (on static homepage button redirects to GH Marketplace Install trigger auth flow)
    // // --> URL might be http://127.0.0.1:3000 instead? (hits .get("/"))
    // TODO: should have error handling: [example](https://github.com/covalence-io/ws-simple/blob/main/routers/index.ts)

/**
 * This sets up the event listeners (like webhook).
 * E.g.: when the app receives a webhook event (POST?) from GitHub with a `X-GitHub-Event` header value of `pull_request`
 * and an `action` payload value of `opened`, it calls the `pullRequestOpenedHandler`
 */
export const registerEventListeners = (octokitClient: AppType) => {
  console.log("\x1b[36m%s\x1b[0m", "Event Liseteners registering...");
  // TODO: Wss On Connection?
  // Installation
  octokitClient.webhooks.on("installation.created", octokitApi.getInstallation);
  octokitClient.webhooks.on("installation.created", octokitApi.getAndPostInstallationRepos);
  octokitClient.webhooks.on("installation.created", octokitApi.createOwnerUser);
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

const httpLogger = (req, res, next) => {
    const time = new Date();
    const formattedDate = time.toLocaleTimeString("en-US");
    console.log("\x1b[32m%s\x1b[0m", `[${formattedDate}] ${req.method} ${req.url}`);
    next();
};
