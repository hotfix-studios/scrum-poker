import { Router } from "express";

import { octokitApi } from "../api/index.js";

const installationsRouter = Router();

/**
 * @implements route /api/installations
 */
// installationsRouter
//   .route("/auth/:id")
//   .post([
//     octokitApi.postAuth,
//     octokitApi.sendData
//   ]);

installationsRouter
  .route("/auth/:code")
  .post([
    octokitApi.postAuth,
    octokitApi.getOrPostUser,
    octokitApi.getUserRepos,
    octokitApi.sendData
  ])

export default installationsRouter;
