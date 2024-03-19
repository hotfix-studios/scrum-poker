import { app } from '../app.js';

/* DB Context Repositories (CRUD) */
import { installationController, userController, repositoryController } from "../db/controllers/index.js";
import { InstallationController } from "../db/controllers/installation.controller.js";
import { UserController } from "../db/controllers/user.controller.js";
import { RepositoryController } from "../db/controllers/repository.controller.js";

/* TYPES */
import { App as AppType } from "octokit";
/* TODO: destructure types for import optimization */
import * as OctokitTypes from '../types/octokit.js';

/* Utility Helpers */
import { findOwner } from "../utility/index.js";

interface Context {
  app: AppType;
  installationController: InstallationController;
  userController: UserController;
  repositoryController: RepositoryController;
};

const _context: Context = { app, installationController, userController, repositoryController };

/**
 * Octokit Responsibilities:
 * - Get GH User info
 * - Get Repos ✔
 * - - Get Backlogs
 * - - Get associated users (repo)
 * - Get Organization
 * - - Get associated users (org)
 * - Put Issues (move lanes)
 * - Post/Put story points to issues (look for field with type number (on Project/Issues))
 * - Post Sprint (completed)(pending completion?)
 */

/**
 * TODO: IDEA:
 * THIS FILE SHOULD ONLY BE EVENT HANDLER FUNCTIONS THAT CALL octokit (or any?) Controller Functions?
 */

/* TODO: Replace from a fetched Installation ID from 3 below options */

class OctokitApi {

  public readonly _appContext: AppType;
  public readonly _installationContext: InstallationController;
  public readonly _userContext: UserController;
  public readonly _repositoryContext: RepositoryController;

  /**
   * @summary Instantiated Octokit App class exposes Octokit API/REST
   */
  constructor(_context: Context) {
    const { app, installationController, userController, repositoryController } = _context;
    this._appContext = app;
    this._installationContext = installationController;
    this._userContext = userController;
    this._repositoryContext = repositoryController;
  }

  /** ************ **
   *  Installation  *
   ** ************ **/

  // TODO: INIT INSTALL DETAILS
  // TODO: this function does more than just get, decouple get and write ops
  getInstallation = async ({ octokit, payload }): Promise<void> => {
    // TODO: un-destructure and log entire input obj
    console.log(`Entering octokit.api getInstallation() - `);
    const data = payload;
    console.log(data);
    /* TODO: try/catch error handle this? */
    try {

      await this._installationContext.findOrCreateInstallation(payload);
    } catch (error) {

      console.error(`octokit api getInstallation catch:`, error);
      throw error;
    }
  };

  /** ************ **
   *  Repository * **
   ** ************ **/

  getAndWriteInstallationRepos = async ({ octokit, payload }): Promise<void> => {
    try {

      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
      const { repositories } = data;

      const documents = await this._repositoryContext.createInstallationRepositories(repositories);

      if (!documents) console.error(`repositories failed to WRITE to DB at repositoryController.createInstallationRepos... call in api`);

    } catch (error) {

      console.error(`FAILED at .rest.apps.listReposAccess...()`, error);
      throw error;
    }
  };

  handleRepoCreate = async ({ octokit, payload }): Promise<void> => {
    console.log("event registering...");
    try {
      await this._repositoryContext.createRepo(payload);
    } catch (error) {
      console.error(`GH Repo Create event call handleRepoCreate write one to DB failure: `, error);
    }
  };

  /** ************ **
   *  *** User  ** **
   ** ************ **/

  setOwnerUser = async ({ payload }): Promise<void> => {
    const { installation }: { installation: OctokitTypes.Installation, } = payload;
    const { account }: { account: OctokitTypes.User } = installation;

    try {

      await this._userContext.createUser(account, false, true);
    } catch (error) {

      if (!installation || !account) {
        console.error(`Null value on payload for setOwnerUser`, error);
        throw error;
      }

      console.error(`Internal server error from setOwnerUser octokit.api:`, error);
      throw error;
    }
  };

  /** ************ **
   **  ** Issues * **
   ** ************ **/

   // TODO: get issues
  getIssues = async () => {
    try {
      // TODO: getOwnerId ??
      const repoId: number = await this._repositoryContext.getRepoId(138710780);
      const repoIssuesUrl: string = await this._repositoryContext.getRepoIssuesUrl(repoId);

      // this._appContext.octokit.request("GET /issues") // pass owner and repo vars in options obj?

    } catch (error) {

    }

    // this._appContext.octokit.request...
  };

  issueOpenedHandler = async ({ octokit, payload }): Promise<void> => {
    console.log("PAYLOAD INSTALL ID:", payload.installation.id);

    const installationLog = await this._appContext.getInstallationOctokit(payload.installation.id);

    /* TODO: THESE TWO SHOULD ACTUALLY BE USED AT SOME POINT: */
    // const foundOwnerId: number = await findOwner(payload);
    // const dbQueryInstallId: number = await installationController.findInstallationIdByOwnerId(foundOwnerId);
    // console.log("RECURSIVE DB QUERY INSTALL ID:", dbQueryInstallId);


    /* GETTERS for REPOS on APP INSTALLATION */
    // try {
    //   // TODO: Look at params needed for octo installation.rest.x.stuff()
    //   const getRepos = await installationLog.rest.repos.get({ owner: "Cohive-Software", repo: "docs" });
    //   console.log(`installation.rest.repos.get(): ${getRepos}`);

    //   for (const key in getRepos) {
    //     console.log("KEY:", key);
    //     console.log("VALUE:", getRepos[key]);
    //   }

    // } catch (error) {
    //   console.error(`FAILED at .rest.repos.get()`, error);
    //   throw error;
    // }


    // const listCollaborators = await installationLog.rest.repos.listCollaborators();
    // console.log(`list Collaborators on rest.REPOS on APP INSTALLATION: ${listCollaborators}`);
    // const listUsers = await installationLog.rest.users.list();
    // console.log(`installation.rest.USERS list Users and Orgs: ${listUsers}`)

    // const listAppInstallations = await installationLog.rest.orgs.listAppInstallations()
    // const list = await installationLog.rest.orgs.list();
    // const listMembers = await installationLog.rest.orgs.listMembers();
    // console.log("app.listAppInstallations:", listAppInstallations);
    // console.log("app.list:", list);
    // console.log("app.listMembers:", listMembers);

    const { repository, issue }: { repository: OctokitTypes.Repository, issue: OctokitTypes.Issue } = payload;
    const params = { owner: repository.owner.login, repo: repository.name };
    const issueNumber = issue.number;

    /* THIS WILL BE ITS OWN METHOD */
    const { data } = await octokit.rest.issues.listForRepo(params);
    // console.log(data);

    return octokit.rest.issues.createComment({
      ...params,
      issue_number: issueNumber,
      body: "Hello, World!",
    });
  };

  /* TODO: ISSUES could maybe just live in the GH Rest and the app can GET repository.issues_url to the octokit.request GET issues_url */
  pullRequestOpenedHandler = async ({octokit, payload}): Promise<void> => {
    console.log(`Received a pull request event for #${payload.pull_request.number}`);
    // TODO: LOG PAYLOAD HERE
    try {
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: "Thanks for opening a new PR!",
        headers: {
          "x-github-api-version": "2022-11-28",
          // "content-type": "application/json", // might not need, possibly default
          "x-accepted-github-permissions": true // this header as well to get a response of all required permissions for the GH API request!
        },
      });
    } catch (error) {
      if (error.response) {
        console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
      }
      console.error(error)
    }
  };

  wildCardErrorHandler = (error): void => {
    if (error.name === "AggregateError") {
      console.error(`Error processing request: ${error.event}`);
    } else {
      console.error(error);
    }
  };

}


export default new OctokitApi(_context);
