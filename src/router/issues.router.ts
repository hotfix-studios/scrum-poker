import { Router } from "express";

import { octokitApi } from "../api/index.js";

const issuesRouter = Router();

/**
 * @implements route /api/issues
 */
issuesRouter
  .route("/:id")
  .get();

/* TODO: gets full_name */
issuesRouter
  .route("/:owner/:repo")
  .get([
    octokitApi.getUserNameAndTypeById, // TODO: MAKE THIS HANDLE THE PATH PARAMS AND PASS TO .getIssues
    octokitApi.getRepoNameByUserIdOrParam,
    octokitApi.getIssues,
    octokitApi.sendData
  ]);

export default issuesRouter;
