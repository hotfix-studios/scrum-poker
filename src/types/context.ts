import { InstallationController, UserController, RepositoryController, IssuesController } from "../db/controllers/index.js";

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

export {
  InstallationController,
  UserController,
  RepositoryController,
  IssuesController
}
