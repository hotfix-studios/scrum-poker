import { Router } from "express";

import { octokitApi } from "../api/index.js";

const usersRouter = Router();

/**
 * @openapi
 * /api/users/{id}/{projections}
 *  get:
 *    description: Will Get User (org || contributor) data (* || projections) from DB
 *    tags: [User, App, DB]
 *    produces:
 *      - application/json
 *    parameters:
 *      - $ref: '#/parameters/userID'
 *    responses:
 *      200:
 *        description: OK
 */
usersRouter
  .route("/:id/:projections")
  .get([
    octokitApi.getUserDataById,
    octokitApi.sendData
  ]);

/**
 * @openapi
 * /api/users/{id}
 *  get:
 *    description: Will Get all User (org || contributor) data from DB
 *    tags: [User, App, DB]
 *    produces:
 *      - application/json
 *    parameters:
 *      - $ref: '#/parameters/userID'
 *    responses:
 *      200:
 *        description: OK
 */
usersRouter
  .route("/:id")
  .get([
    octokitApi.getUserDataById,
    octokitApi.sendData
  ]);

/* needs user id */
usersRouter
  .route("/org/:id/members")
  .get([
    // octokitApi.postAuth, // this will first NEED to happen in separate request
    octokitApi.getUserNameAndTypeById,
    octokitApi.getOrganizationMembers,
    octokitApi.sendData
  ]);

/* needs user ID (or name if extended to use that) and repo name */
usersRouter
.route("/:id/repo/:repo/contributors")
.get([
  // octokitApi.postAuth, // this will first NEED to happen in separate request
  octokitApi.getUserNameAndTypeById,
  octokitApi.getRepoNameByUserIdOrParam,
  octokitApi.getRepoContributors,
  octokitApi.sendData
]);


export default usersRouter;
