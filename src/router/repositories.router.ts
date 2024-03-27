import { Request, Response, Router } from "express";

// import { installationController, userController, repositoryController } from "../db/controllers/index.js";
import { octokitApi } from "../api/index.js";

const repositoriesRouter = Router();

/**
 * @implements route /api/repos
 */
repositoriesRouter
  .route("/:id")
  .get(octokitApi.getReposById);


export default repositoriesRouter;
