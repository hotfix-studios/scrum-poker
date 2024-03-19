/* TODO: refactor to import from controller/index? */
import { InstallationController } from "../../db/controllers/installation.controller.js";
import { UserController } from "../../db/controllers/user.controller.js";
import { RepositoryController } from "../../db/controllers/repository.controller.js";
import { App as AppType } from "octokit";


export interface Context {
  app: AppType;
  installationController: InstallationController;
  userController: UserController;
  repositoryController: RepositoryController;
};