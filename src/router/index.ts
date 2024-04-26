import { Application, Request, Response, Router, json, urlencoded, static as Static, NextFunction } from "express";
import { middleware } from "../app.js";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import cors from "cors";

///////////////////
/// API ROUTERS ///
///////////////////

/* TODO: these should be importing on a single object */
import installationsRouter from "./installations.router.js";
import issuesRouter from "./issues.router.js";
import repositoriesRouter from "./repositories.router.js";
import usersRouter from "./users.router.js";

///////////////////
////// TYPES //////
///////////////////

// import { App as AppType } from "octokit";
import { OAuthApp } from "@octokit/oauth-app";
import { octokitApi } from "../api/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const api = Router();

api.use("/installations", installationsRouter);
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

    server.get("/error-logger", errorLogger);

    /* Serve all static js, css, html, gz files from unity dist/webgl and sub-folders */
    server.use(Static(path.resolve(__dirname, "..", "webgl")));

    /* All api routes */
    server
        .use([httpLogger, setResponseLocals, setProjectionsContext])
        .use("/api", api); // TODO: figure out why /api/ url was working... this might need to go up near use middleware

    server.get("/", (req, res) => {
        res.sendFile("/webgl/index.html", { root: "dist" });
    });

    /* Fallback 404 not found error handling */
    server.use((req, res) => {
        res.status(404).send('Not Found');
    });

};

// TODO: should have error handling: [example](https://github.com/covalence-io/ws-simple/blob/main/routers/index.ts)

/**
 * @deprecated
 * @summary This sets up the event listeners (like webhook).
 * @description e.g. when the app receives a webhook event (POST?) from GitHub with a `X-GitHub-Event` header value of `pull_request`
 * and an `action` payload value of `opened`, it calls the `pullRequestOpenedHandler`
 */
// export const registerEventListeners = (octokitClient: OAuthApp) => {
//   console.log("\x1b[36m%s\x1b[0m", "Event Listeners registering...");
//   // TODO: Wss On Connection?
//   /* INSTALLATION */
//   octokitClient.webhooks.on("installation.created", octokitApi.handleInstallationCreate);
//   octokitClient.webhooks.on("installation.created", octokitApi.handleInstallationReposFindOrCreate);
//   octokitClient.webhooks.on("installation.created", octokitApi.handleOwnerUserCreate);
//   /* REPOS */
//   octokitClient.webhooks.on("repository.created", octokitApi.handleRepoCreate); // event not working
//   /* ISSUES */
//   octokitClient.webhooks.on("issues.opened", octokitApi.issueOpenedHandler);
//   // TODO: label.added? event - grab and move Issue from Backlog to In Progress lane (GH SCRUM POKER v2.0)
//   // octokitClient.webhooks.on("issues.labeled", octokitApi.something);
//   /* PRs */
//   octokitClient.webhooks.on("pull_request.opened", octokitApi.pullRequestOpenedHandler);
//   /* ERRORS */
//   octokitClient.webhooks.onError(octokitApi.wildCardErrorHandler);
// };

/* TODO: rm */
const blcok = "ass";

export const registerEventListeners = (octokitClient: OAuthApp) => {
  /* UPGRADE OAUTH APP WITH TOKEN */
  octokitClient.on("token.created", octokitApi.handleAuthTokenUpgrade);
};

// TODO: check out if this is good:
// app.webhooks.verify

///////////////////////
/// GLOBAL HANDLERS ///
///////////////////////

const httpLogger = (req: Request, res: Response, next: NextFunction) => {
    const time = new Date();
    const formattedDate = time.toLocaleTimeString("en-US");
    console.log("\x1b[32m%s\x1b[0m", `[${formattedDate}] ${req.method} ${req.url}`);
    const pathSegments = req.url.split("/");
    console.log("\x1b[33m%s\x1b[0m", `API controller -- ${pathSegments[2]}`);
    next();
};

const setResponseLocals = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.installation_data = {};
    res.locals.repository_data = {};
    res.locals.user_data = {};
    next();
  };

const setProjectionsContext = (req: Request, res: Response, next: NextFunction): void => {
    const pathSegments = req.url.split("/");
    const apiIndex = pathSegments.indexOf("api");
    if (apiIndex !== -1 && apiIndex < pathSegments.length - 1) {
      res.locals.routeProjectionsContext = pathSegments[apiIndex + 1];
    } else { /* error condition */
      res.locals.routeProjectionsContext = "";
    }
    next();
};

/* TODO: This reads from local error.log on disk... needs to be pruned incrementally? */
const errorLogger = async (_: Request, res: Response): Promise<void> => {
  try {
    const pathToFile = path.resolve(__dirname, "..", "..", "error.log");
    console.log(`Reading from Error Log file on Disk.. -- ${pathToFile}`);
    fs.readFile(pathToFile, "utf-8", (err, data) => {
      if (err) {
        console.error(`404 root error.log could not be read.. ${err}`)
        res.sendStatus(404);
      }
      res.setHeader("Access-Control-Allow-Origin", "*"); /* TODO: SWAP OUT THIS "*" WITH ACTUAL ORIGIN (replace lt proxy) */
      res.send(data); /* TODO: swap out origin in S3 permissions: CORS when static origin created (when above swap happens) (also noted in src/index) */
    });
  } catch (error) {
    console.error(`500 Failure reading error.log from disk.. ${error}`);
    res.sendStatus(500);
  }
};
