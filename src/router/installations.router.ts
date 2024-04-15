import { Router } from "express";

import { octokitApi } from "../api/index.js";

const installationsRouter = Router();

/**
 * @implements base-route /api/installations
 */

/**
 * @openapi
 * /api/installations/auth/{id}:
 *  post:
 *    description: Sends Installation ID to DB Create, upgrades the App auth simultaneously
 *    tags: [Installation, App, DB]
 *    produces:
 *      - application/json
 *    parameters:
 *      - $ref: '#/parameters/installationID'
 *    responses:
 *      200:
 *        description: Ok
 */
installationsRouter
  .route("/auth/:id")
  .post(octokitApi.postAuth);

export default installationsRouter;
