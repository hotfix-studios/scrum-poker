import { Request, Response, Router } from "express";

// import { installationController, userController, repositoryController } from "../db/controllers/index.js";
import { octokitApi } from "../api/index.js";

const repositoriesRouter = Router();

/**
 * @implements route /api/repos
 */
repositoriesRouter
  .route("/names/:id")
  .get(octokitApi.getReposById);

  /**
   * @summary this route uses 3 middleware to hit repos and users in db, targeting `repo._id, repo.name, user.name`
   * @returns `obj.repo_data = { _id: 1234.., name: "blah", owner_id: 1234.. }`
   * @returns `obj.user_data = { _id: 1234.., nameL "blah-blah" }`
   */
repositoriesRouter
  .route("/names/:id/:projections")
  .get([
    octokitApi.getRepoDataById,
    // octokitApi.getUserNameByOwnerId,
    // octokitApi.getIssues,
    octokitApi.sendData
  ]);
  // TODO: rm /:code endpoint param across throughput

export default repositoriesRouter;
