import { Request, Response, Router } from "express";

import { octokitApi } from "../api/index.js";

const installationsRouter = Router();

/**
 * @implements route /api/installations
 */
installationsRouter
  .route("/auth/:id")
  .post(octokitApi.getAuth);

export default installationsRouter;
