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


export default issuesRouter;
