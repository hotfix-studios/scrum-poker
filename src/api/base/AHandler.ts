/* TODO: refactor to import from controller/index? */
import { InstallationController } from "../../db/controllers/installation.controller.js";
import { UserController } from "../../db/controllers/user.controller.js";
import { RepositoryController } from "../../db/controllers/repository.controller.js";
import { App as AppType } from "octokit";

/* TODO: maybe these types should be moved to types/*.d.ts file? */

export interface Context {
  app: AppType;
  installationController: InstallationController;
  userController: UserController;
  repositoryController: RepositoryController;
};

export enum ModelContext {
  Installation = "installation",
  Repository = "repository",
  User = "user",
  Room = "room"
};