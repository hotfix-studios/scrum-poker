import { app } from '../app.js';

/* DB Context Repositories (CRUD) */
import { installationController, userController, repositoryController } from "../db/controllers/index.js";

/* Types */
import { Request, Response, NextFunction } from "express";
import { App as AppType, Octokit } from "octokit";
import { OctokitTypes, ContextTypes } from '../types/index.js';
import { ModelContext } from '../types/context.js'; // TODO: idk why this needs to be separately imported..

const _context: ContextTypes.Context = { app, installationController, userController, repositoryController };

/* Utility Helpers */
const Utility = new (await import("../utility/index.js")).default(_context);

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

class OctokitApi {

  public readonly _appContext: AppType;
  public readonly _installationContext: ContextTypes.InstallationController;
  public readonly _userContext: ContextTypes.UserController;
  public readonly _repositoryContext: ContextTypes.RepositoryController;

  /**
   * @description Octokit instance with installation ID level authentication (GH App)
   */
  private _authenticatedOctokit: Octokit;
  private _installationId: number;

  /**
   * @summary Instantiated Octokit App class exposes Octokit API/REST
   */
  constructor(context: ContextTypes.Context) {
    const { app, installationController, userController, repositoryController } = context;
    this._appContext = app;
    this._installationContext = installationController;
    this._userContext = userController;
    this._repositoryContext = repositoryController;
  }

  ///////////////////////
  //// Installations ////
  ///////////////////////

  postAuth = async (req: Request, res: Response, next: NextFunction) => {
    console.log("getAuth firing!!");
    const id: number = req.params.id ? Number(req.params.id) : req.body.installationId;
    this._installationId = id;
    console.log("installation ID inside getAuth == ", id);

    /* The following will be if OAuth Token/session validation is needed... */
    // #region Auth Session
    // const token = await this._appContext.oauth.createToken({ code }); // replace with this._authenticatedOctokit ?
    // const authObj = this._appContext.oauth.getUserOctokit({ code });

    /* get installation document from DB? */
    // installation.token = token;
    // installation.save();
    // new up auth octokit (OAuth/Auth/App)
    // #endregion

    /* Upgrade this._appContext octokit Instance to Authenticated Installation Instance */
    // TODO: GRAB REQUIRED DATA FROM AUTH TO LOOKUP USER.UUID? USERNAME? NAME FIRST/LAST? AVATAR URL?
    const { data: slug } = await this._appContext.octokit.rest.apps.getAuthenticated();

    // ********** // this._authenticatedOctokit.rest.repos.listForUser(); // ***********

    /* option 1 */
    // this._appContext.octokit.rest.repos.listCollaborators();
    // write collaborators (_ids) to Users table in DB
    // write users._ids to Installation.collaborators
    // this should give collaborator/users access to specific repo

    /* option 2 */
    // this._appContext.octokit.rest.repos.listCollaborators();
    // write these collaborators to Installation.collaborators in DB
    // generate UUID/key (user distributes)

    try {

      this._authenticatedOctokit = await this._appContext.getInstallationOctokit(id);

      console.log("Successfully Authenticated and Upgraded Octokit...")
      res.sendStatus(200);
    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", "failed to authenticate and upgrade octokit: ", error);
      res.sendStatus(500);
    }
  };

  /* TODO: this can be made into a wildcard fn for all controllers (controller string as arg to specify) */
  getInstallationDataById = async (req: Request, res: Response, next: NextFunction) => {
    const targetContext = ModelContext.Installation;
    const id: number = Number(req.params.id);
    const projections: string[] = Utility.getProjectionsByContext(req.params.projections, targetContext);

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


  //////////////////////
  //// Repositories ////
  //////////////////////

  getRepoDataById = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Success calling modular getRepoDataById");
    const targetContext = ModelContext.Repository;

    const projections: string[] = req.params.projections
      ? req.params.projections?.split(",")
      : Utility.getProjectionsByContext(req.params.projections, targetContext);

    /* TODO: make function that performs installation lookup process to all repos for install data (use in getReposById) */
    const installation = await this._installationContext.findInstallationById(this._installationId);

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

    /* TODO: Only need this installation_data if next() in middleware sequence requires... */
    // res.locals.installation_data = res.locals.installation_data ? res.locals.installation_data : {};
    // res.locals.installation_data.id = this._installationId;

    res.locals.repo_data = installationRepoData;

    /* TODO: conditionally apply this?? id */
    // @ts-ignore
    // req.params.id = data.owner_id.toString();
    next();
  };

  getReposById = async (req: Request, res: Response) => {
    console.log("**ENDPOINT HAS BEEN HIT**");
    console.log("-- RECEIVING HTTP FROM C# inside octokitApi.getRepos");
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
    try {
      await this._repositoryContext.createRepo(payload);
      console.log("event registering... handleRepoCreate: _repositoryContext.createRepo called success✅");
    } catch (error) {
      console.error(`GH Repo Create event call handleRepoCreate write one to DB failure: `, error);
    }
  };

  //////////////////////
  ///////  Users  //////
  //////////////////////

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
    const projections: string[] = Utility.getProjectionsByContext(req.params.projections, targetContext);

    try {

      const data = await this._userContext.findDocumentProjectionById(id, projections);
      res.locals.user_data = data;
      next();
    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", "failure userContext.find...ById, projections: ", error);
    }
  };

  getUserNameByOwnerId = async (req: Request, res: Response, next: NextFunction) => {
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

  //////////////////////
  //////  Issues  //////
  //////////////////////

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
      owner_name = Utility.getUserName(res.locals);
      owner_type = Utility.getUserType(res.locals); // this handles .user_data and installation_data (only db types with ".type")
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

        let projectsData;

        if (typeForPath == "orgs") {
          projectsData = await this._authenticatedOctokit.request("GET /orgs/{org}/projects", {
            org: params.owner,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28"
            }
          });
        } else if (typeForPath == "users") {
          projectsData = await this._authenticatedOctokit.request("GET /users/{username}/projects", {
            username: params.owner,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28"
            }
          });
        }

        console.log("RAW FETCH DATA: {projects} ", projectsData);

        /* TODO: Deserialize this somehow if needed? currently saying projectsData.json is not a function */
        // const jsonProjects = await projectsData.json();

        // console.log("PROJECTS JSON FROM GET: ", jsonProjects);

        // TODO: if projectsData found, put on res.locals... obj, then next(), else continue to 2nd Try (fetch Issues)

    } catch (error) {

        console.error("fail to hit REST GET {projects}:", error);
        res.locals.repository_data.issues = null;
        // next();
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
          if (issue.state)
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
      // next();

    } catch (error) {

      console.error("fail to hit REST GET {issues}:", error);
      // next();
    }

    next();
  };

  /////////////////////////
  ///// Util/Wildcard /////
  /////////////////////////

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

  ////////////////////////
  //// Event Handlers ////
  ////////////////////////

  issueOpenedHandler = async ({ octokit, payload }): Promise<void> => {
    // console.log("PAYLOAD INSTALL ID:", payload.installation.id);

    // TODO: WRITE new ISSUE TO BACKLOG MODEL

    // const installationLog = await this._appContext.getInstallationOctokit(payload.installation.id);

    /* TODO: THESE TWO SHOULD ACTUALLY BE USED AT SOME POINT: */
    // const foundOwnerId: number = await findOwnerId(payload); // TODO: this fn might work?
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
