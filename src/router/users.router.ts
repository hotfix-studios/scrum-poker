import { Request, Response, Router } from "express";

import { installationController, userController, repositoryController } from "../db/controllers/index.js";
import { octokitApi } from "../api/index.js";

const usersRouter = Router();

/**
 * @implements route /api/users
 */
usersRouter
  .route("/:id")


export default usersRouter;