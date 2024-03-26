import { Request, Response, Router } from "express";

import { installationController, userController, repositoryController } from "../db/controllers/index.js";
import { octokitApi } from "../api/index.js";

const issuesRouter = Router();

/**
 * @implements route /api/issues
 */
issuesRouter
  .route("/:id")
  .get()


/* make sure cb0 and cb1 call next() */
// issuesRouter
//  .route("/:id")
//  .get([octokitApi.cb0, octokitApi.cb1, octokitApi.cb2])

export default issuesRouter;
