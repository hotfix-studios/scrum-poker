import InstallationController from "./installation.controller.js";
import UserController from "./user.controller.js";
import RepositoryController from "./repository.controller.js";

import { Installation, User, Repository } from "../models/index.js";

/** ***************** **
 * ******************* *
 * Export Controllers **
 * ******************* *
 ** ***************** **/

export const installationController = new InstallationController(Installation);
export const userController = new UserController(User);
export const repositoryController = new RepositoryController(Repository);

/* TODO: export all controllers as a single Repository or Unit of Work obj? */
