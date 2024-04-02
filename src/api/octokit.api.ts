import { app } from '../app.js';

import dotenv from "dotenv";

/* DB Context Repositories (CRUD) */
import { installationController, userController, repositoryController } from "../db/controllers/index.js";
import { InstallationController } from "../db/controllers/installation.controller.js";
import { UserController } from "../db/controllers/user.controller.js";
import { RepositoryController } from "../db/controllers/repository.controller.js";

import { Context, ModelContext } from "./base/AHandler.js";

/* TYPES */
import { Request, Response, NextFunction } from "express";
import { App as AppType, Octokit } from "octokit";
/* TODO: destructure types for import optimization */
import * as OctokitTypes from '../types/octokit.js';

/* Utility Helpers */
import { findOwner } from "../utility/index.js";

dotenv.config();

const _context: Context = { app, installationController, userController, repositoryController };

/**
 * Octokit Responsibilities:
 * - Get GH User info ✔
 * - Get Repos ✔
 * - - Get Backlogs ✔
 * - - Get associated users (repo)
 * - Post Labels == User Input story point values
 * - Get Organization
 * - - Get associated users (org)
 * - Post/Patch story points to issues (look for field with type number (on Project/Issues))
 * - - Add label equivalent story points
 * - Post Sprint (completed)(pending completion?)
 */

/**
 * TODO: IDEA:
 * THIS FILE SHOULD ONLY BE EVENT HANDLER FUNCTIONS THAT CALL octokit (or any?) Controller Functions?
 */

class OctokitApi {

  public readonly _appContext: AppType;
  public readonly _installationContext: InstallationController;
  public readonly _userContext: UserController;
  public readonly _repositoryContext: RepositoryController;

  /**
   * @description Octokit instance with installation ID level authentication (GH App)
   */
  private _authenticatedOctokit: Octokit;
  private _installationId: number;

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

  /* TODO: this can be made into a wildcard fn for all controllers (controller string as arg to specify) */
  getInstallationDataById = async (req: Request, res: Response, next: NextFunction) => {
    const targetContext = ModelContext.Installation;
    const id: number = Number(req.params.id);
    const projections: string[] = this.getProjectionsByContext(req.params.projections, targetContext);

    const data = await this._installationContext.findDocumentProjectionById(id, projections);

    res.locals.installation_data = data;
    // @ts-ignore
    req.params.id = data.owner_id.toString();
    next();
  };

  // TODO: this function does more than just get, decouple get and write ops
  getInstallation = async ({ octokit, payload }): Promise<void> => {
    // TODO: un-destructure and log entire input obj
    console.log(`Entering octokit.api getInstallation() - `);
    const data = payload;

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

  /* THIS IS THE FIRST MIDDLEWARE FN TO BE CALLED IN END-USER EXPERIENCE */
  getRepoDataById = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Success calling modular getRepoDataById");
    console.log("ID from PARAMS: ", req.params.id);
    const targetContext = ModelContext.Repository;
    const id: number = Number(req.params.id);
    this._installationId = id;

    /* Upgrade this._appContext octokit Instance to Authenticated Installation Instance */
    const { data: slug } = await this._appContext.octokit.rest.apps.getAuthenticated();
    console.log("SLUG???: ", slug);
    this._authenticatedOctokit = await this._appContext.getInstallationOctokit(this._installationId);

    const projections: string[] = req.params.projections
      ? req.params.projections?.split(",")
      : this.getProjectionsByContext(req.params.projections, targetContext);

    /* TODO: make function that performs installation lookup process to all repos for install data (use in getReposById) */
    let installation = await this._installationContext.findInstallationById(id);

    //#region OAuth Token
    // const token = await this._appContext.oauth.createToken({ code });
    // const authObj = this._appContext.oauth.getUserOctokit({ code });

    // installation.token = token;
    // installation.save();

    // new up auth octokit (OAuth/Auth/App)
    //#endregion

    const installationReposIds: number[] = installation.repos;

    const installationRepoDataPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
      const data = await this._repositoryContext.findDocumentProjectionById(repoId, projections);
      // @ts-ignore
      return data;
    });

    const installationRepoData = await Promise.all(installationRepoDataPromises);

    /* TODO: WARN - req.params.projections may interfere with next() fn this.getProjectionsByContext calls? */

    console.log("PROJECTIONS FROM PARAMS: ", projections);

    console.log("DATA: ALL repo data?? == ", installationRepoData);

    res.locals.installation_data = res.locals.installation_data ? res.locals.installation_data : {};
    res.locals.installation_data.id = id;
    res.locals.repo_data = installationRepoData;
    /* TODO: conditionally apply this?? id */
    // @ts-ignore
    // req.params.id = data.owner_id.toString();
    next();
  };

  getReposById = async (req: Request, res: Response) => {
    console.log("**ENDPOINT HAS BEEN HIT**");
    console.log("-- RECEIVING HTTP FROM C# inside octokitApi.getRepos");
    console.log(req);
    const id: number = Number(req.params.id); // req.params? req.query?
    console.log("INSTALL ID: from C# HTTP REQ", id);

    let installation = await this._installationContext.findInstallationById(id);

    const installationReposIds: number[] = installation.repos;

    const installationRepoNamesPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
      const data = await this._repositoryContext.findRepoNameById(repoId);
      // @ts-ignore
      return data.name;
    });

    const installationRepoNames = await Promise.all(installationRepoNamesPromises);

    res.status(200).send(installationRepoNames);

  };

  getRepoIssuesUrl = async (req: Request, res: Response, next: NextFunction) => {
    const id: number = Number(req.params.id);
    const issues_url = await this._repositoryContext.findRepoIssuesUrl(id);

    res.locals.data.issues_url = issues_url;
    next();
  };

  /* TODO: needs to project .owner_id but how is it looked up? by _id or by owner_id? */
  getRepoOwnerId = async (req: Request, res: Response, next: NextFunction) => {
    throw new Error("method not implemented");
  };

  getAndPostInstallationRepos = async ({ octokit, payload }): Promise<void> => {
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

  getUserDataById = async (req: Request, res: Response, next: NextFunction) => {
    const targetContext = ModelContext.User;
    let id: number;

    /* TODO: this might have bad edge cases where multiple res.locals obj exist (also should be a class function...) */
    /* IDEA: append "flag" or string pre-Next() i.e.: res.locals.prev = "user" where res.locals.user_data was just appended... */
    /* request coming from http end point directly */
    // if (req.params.id) {
    //   id = Number(req.params.id);

    // /* response coming from next() middleware call Installation */
    // } else if (res.locals.installation_data.owner_id) {
    //   id = res.locals.installation_data.owner_id

    // /* response coming from next() middleware call Installation */
    // } else if (res.locals.repository_data.owner_id) {
    //   id = res.locals.repository_data.owner_id;

    // /* response coming from next() middleware call Users */
    // } else if (res.locals.user_data._id) {
    //   id = res.locals.user_data._id
    // }

    // TODO: make sure this data exists from prev middleware req... if not, append to res.locals in prev
    // const projections: string[] = req.body.user_projections;
    const projections: string[] = this.getProjectionsByContext(req.params.projections, targetContext);

    const data = await this._userContext.findDocumentProjectionById(id, projections);
    console.log("FIRST MIDDLEWARE GET USER NAME: ", data);
    res.locals.user_data = data;
    next();
  };

  getUserNameByOwnerId = async (req: Request, res: Response, next: NextFunction) => {
    const targetContext = ModelContext.User;
    // const id: number = Number(req.params.id);
    const id: number = req.params.id
      ? Number(req.params.id)
      : Number(req.params.owner);

    /* TODO: IDEA: (more modular) maybe just return whole User document (rename method) and parse on C# side? */
    const data = await this._userContext
      .findDocumentProjectionById(id, [ "name", "type" ]);
    res.locals.user_data = data;

    /* if repository_data has not been assigned to locals, create an empty obj */
    res.locals.repository_data = res.locals.repository_data
      ? res.locals.repository_data
      : {};

    /* get repo name from req if exists, else get it from repository_data from prev middleware assignment */
    res.locals.repository_data.name = req.params.repo
      ? req.params.repo
      : res.locals.repository_data.name
        ? res.locals.repository_data.name
        : null;
    next();
  };

  createOwnerUser = async ({ payload }): Promise<void> => {
    const { installation }: { installation: OctokitTypes.Installation, } = payload;
    const { account }: { account: OctokitTypes.User } = installation;

    try {

      await this._userContext.createUser(account, false, true);
    } catch (error) {

      if (!installation || !account) {
        console.error(`Null value on payload for createOwnerUser`, error);
        throw error;
      }

      console.error(`Internal server error from createOwnerUser octokit.api:`, error);
      throw error;
    }
  };

  /** ************ **
   **  ** Issues * **
   ** ************ **/

  // TODO: get issues
  getIssues = async (req: Request, res: Response, next: NextFunction) => { // issueURLs: string[] = []
    const owner_id = req.params.owner
      ? Number(req.params.owner)
      : req.params.id
        ? Number(req.params.id)
        : null;

    let owner_name: string;
    let owner_type: string;

    if (res.locals) {
      owner_name = this.getUserName(res.locals);
      owner_type = this.getUserType(res.locals); // this handles .user_data and installation_data (only db types with ".type")
    } else {
      const ownerDoc = await this._userContext
        .findDocumentProjectionById(owner_id, [ "name", "type" ]);
      // @ts-ignore
      owner_name = ownerDoc.name;
      // @ts-ignore
      owner_type = ownerDoc.type;
    }

    const repo_name = res.locals
      ? res.locals.repository_data.name
      : req.params.repo;

    /* This formats the value associated with owner_type (installation || user) for REST url */
    const typeForPath = owner_type === "Organization"
      ? "orgs"
      : "users";

    const params = { owner: owner_name, repo: repo_name, owner_type: typeForPath };

    /**
     * These two "try" blocks logically fork, top fetches Projects, bottom fetches Issues
     */
    try {

        console.log("REST {projects} URL -- ", `https://api.github.com/${params.owner_type}/${params.owner}/projects`);
        const projectsData = await fetch(`https://api.github.com/${params.owner_type}/${params.owner}/projects`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
            }
        });

        console.log("RAW FETCH DATA: {projects} ", projectsData);

        const jsonProjects = await projectsData.json();

        console.log("PROJECTS JSON FROM GET: ", jsonProjects);

      /**
       * TODO: if projectsData found, put on res.locals... obj, then next(), else continue to 2nd Try (fetch Issues)
       */

    } catch (error) {
        console.error("fail to hit REST GET {projects}:", error);
        res.locals.repository_data.issues = null;
        next();
    }

    try {

          // const { data } = await this._authenticatedOctokit.rest.issues.listForRepo(params);
        const { data: issuesData } = await this._authenticatedOctokit.request("GET /repos/{owner}/{repo}/issues", {
          owner: params.owner,
          repo: params.repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28"
          }
        });

        console.log("RAW ISSUES DATA FROM REQUEST: ", issuesData);

        /**
         * TODO:
         * IF not exists in Backlog && Pointed Models
         * use Issues.controller or whatever to WRITE issues to Backlog Model
         */

        // const jsonIssues = await issuesData.json();

        /* TODO: Should these go into the DB at all? */
        const mappedIssues = issuesData.map((issue: any) => {
          return {
            url: issue.url,
            repository_url: issue.repository_url, // this can be used to look up issues by (this is repo.url from Mongo)
            id: issue.id,
            number: issue.number,
            title: issue.title,
            owner_name: issue.user.login,
            owner_id: issue.user.id,
            labels: issue.labels,
            state: issue.state,
            assignee: issue.assignee,
            assignees: issue.assignees,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            closed_at: issue.closed_at,
            author_association: issue.author_association,
            body: issue.body,
          };
        });


        res.locals.repository_data.issues = mappedIssues;
        next();

    } catch (error) {
      console.error("fail to hit REST GET {issues}:", error);
      next();
    }
  };

  /** *************** **
   *  Util/Wildcard * **
   ** *************** **/

  // TODO: MOVE THESE TO Utils and import? "../utility/index.js";

  /**
   * @summary utility to conditionally parse projection string[] for intended model
   * @param obj req.body (will have projections string[])
   * @returns string[] for model query projections
   */
  getProjections = (obj: any) => {
    return obj.installation_projections
      ? obj.installation_projections
      : obj.repository_projections
        ? obj.repository_projections
        : obj.user_projections
          ? obj.user_projections
          : obj.room_projections
            ? obj.room_projections
            : obj.projections;
  };

  /**
   * @summary utility to conditionally parse projection string[] for intended model specified by context
   * @param obj req.body (will have projections string[])
   * @param targetContext string in "singular-tense" representing target db context (Model) name
   * @returns string[] for model query projections
   */
  getProjectionsByContext = (obj: any, targetContext: string) => {
    const context = targetContext.toLowerCase();
    return context === "installation"
      ? obj.installation_projections
      : context === "repository"
        ? obj.repository_projections
        : context === "user"
          ? obj.user_projections
          : context === "room"
            ? obj.room_projections
            : obj.projections;
  };

  getUserName = (obj: any) => {
    return obj.user_data
      ? obj.user_data.name
      : obj.repository_data
        ? obj.repository_data.full_name.split("/")[0]
        : obj.installation_data
          ? obj.installation_data
          : obj.installation_data.owner_name
  };

  getUserType = (obj: any) => {
    return obj.user_data
      ? obj.user_data.type
      : obj.installation_data
        ? obj.installation_data.type
        : null // error condition
  };

  sendData = (req: Request, res: Response) => {
    console.log("Ending middleware chain. Sending response");
    if (res.locals) {
      /* res.locals will be garbage collected at the end of every req/res cycle */
      const processedBody = res.locals;
      res.send(processedBody);
    } else {
      console.warn("res.locals is null | undefined | falsy, sending empty response body.");
      res.status(200).send();
    }
  };

  /** **************** **
   *  Event Handlers * **
   ** **************** **/

  issueOpenedHandler = async ({ octokit, payload }): Promise<void> => {
    console.log("PAYLOAD INSTALL ID:", payload.installation.id);

    // TODO: WRITE new ISSUE TO BACKLOG MODEL

    // const installationLog = await this._appContext.getInstallationOctokit(payload.installation.id);

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
