import { InstallationController } from "./installation.controller.js";
import { UserController } from "./user.controller.js";
import { RepositoryController } from "./repository.controller.js";
import { IssuesController } from "./issue.controller.js";

import { Installation, User, Repository, Backlog, Pointed } from "../models/index.js";

/** ***************** **
 * ******************* *
 * Export Controllers **
 * ******************* *
 ** ***************** **/

export const installationController = new InstallationController(Installation);
export const userController = new UserController(User);
export const repositoryController = new RepositoryController(Repository);
export const issuesController = new IssuesController(Backlog, Pointed);

export {
  InstallationController,
  UserController,
  RepositoryController,
  IssuesController
}

/* TODO: export all controllers as a single Repository or Unit of Work obj? */
