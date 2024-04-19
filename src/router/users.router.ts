import { Router } from "express";

import { octokitApi } from "../api/index.js";

const usersRouter = Router();

/**
 * @implements route /api/users
 */

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


export default usersRouter;