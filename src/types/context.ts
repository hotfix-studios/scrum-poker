import { InstallationController, UserController, RepositoryController, IssuesController } from "../db/controllers/index.js";
import { OAuthApp } from "@octokit/oauth-app";

export interface Context {
  app: OAuthApp;
  installationController: InstallationController;
  userController: UserController;
  repositoryController: RepositoryController;
  issuesController: IssuesController;
};

export enum ModelContext {
  Installation = "installations",
  Repository = "repos",
  User = "users",
  Room = "rooms"
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
