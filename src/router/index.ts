import { Application, Request, Response, Router, json, urlencoded, static as Static } from "express";
import { middleware } from "../app.js";
import { fileURLToPath } from 'url';
import path from "path";
import cors from "cors";

/* TYPES */
import { App as AppType } from "octokit";
import { octokitApi } from "../api/index.js";

// TODO: Move to user.router.ts (create user router) (move express router there and import here...)
import { userController } from "../db/controllers/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const api = Router();

export const configureServer = (server: Application) => {
    server
        .use(middleware)
        .use(cors())
        .use(json())
        .use(urlencoded({ extended: true }));

    server.use(Static(path.resolve(__dirname, "..", "webgl")));

    server.use("/api", api); // TODO: figure out why /api/ url was working... this might need to go up near use middleware

    server.get("/", (req, res) => {
        /**
         * req.query = { code: string, installation_id: string, setup_action: string }
         */

        /* TODO: Parse req.query.setup_action for conditional user flows */

        const { installation_id } = req.query;
        res.cookie("installation_id", installation_id, { expires: new Date(Date.now() + 900000) });
        //console.log(req);
        /* Generate UUID for "Session" to stay on client */

        res.sendFile("/webgl/index.html", { root: "dist" });
    });

    server.post("/session", async (req, res) => {
      const name = req.body;
      //console.log("REQ:", name);

      const document = await userController.findOne(name);
      console.log(document);
      res.status(201).send(document);
    });

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
  // WSS ON CONNECTION???
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
