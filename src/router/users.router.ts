import { Router } from "express";

import { octokitApi } from "../api/index.js";

const usersRouter = Router();

/**
 * @implements route /api/users
 */
usersRouter
  .route("/:id")


export default usersRouter;