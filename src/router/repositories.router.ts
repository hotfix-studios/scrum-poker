import { Router } from "express";

import { octokitApi } from "../api/index.js";

const repositoriesRouter = Router();

/**
 * @implements route /api/repos
 */

/**
 * @summary this route uses 3 middleware to hit repos and users in db, targeting `repo._id, repo.name, user.name`
 * @returns `obj.repo_data = { _id: 1234.., name: "blah", owner_id: 1234.. }`
 * @returns `obj.user_data = { _id: 1234.., nameL "blah-blah" }`
 */
repositoriesRouter
  .route("/names/:projections")
  .get([
    octokitApi.setResponseLocals,
    octokitApi.getRepoDataById,
    // octokitApi.getUserNameByOwnerId,
    octokitApi.sendData
  ]);

export default repositoriesRouter;
