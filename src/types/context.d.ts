export { InstallationController } from "../db/controllers/installation.controller.ts";
export { UserController } from "../db/controllers/user.controller.ts";
export { RepositoryController } from "../db/controllers/repository.controller.ts";
export { IssuesController } from "../db/controllers/issue.controller.ts";

import { App as AppType } from "octokit";

export interface Context {
  app: AppType;
  installationController: InstallationController;
  userController: UserController;
  repositoryController: RepositoryController;
  issuesController: IssuesController;
};

export enum ModelContext {
  Installation = "installation",
  Repository = "repository",
  User = "user",
  Room = "room"
};

export enum UserProperties {
  User = "user",
  Owner = "owner",
  Sender = "sender",
  Account = "account"
};
