import { app } from '../app.js';
import { installationController, userController, repositoryController } from "../db/controllers/index.js";

/* Types */
import { Request, Response, NextFunction } from "express";
import { App as AppType, Octokit } from "octokit";
import { OctokitTypes, ContextTypes, DTO } from '../types/index.js';
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
   * @implements This string represents the context of the current api route
   * @example /api/repos/names/projections == "repos"
   */
  private _projectionsContext: string;

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

  ///////////////////////////////
  // #region // Route Handlers //

  /////////////////////////////
  // #region Installations ////
  /////////////////////////////

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
  /**
   * @deprecated
   */
  getInstallationDataById = async (req: Request, res: Response, next: NextFunction) => {
    const middlewareContext = ModelContext.Installation;
    const routeProjectionsContext = res.locals.routeProjectionsContext;
    const id: number = Number(req.params.id);
    // const projections: string[] = Utility.getProjectionsByContext(req.params, this._projectionsContext);
    // const projections = middlewareContext === this._projectionsContext ? req.params.projections?.split(",") : [];
    const projections = Utility.getProjectionsByRoute(middlewareContext, routeProjectionsContext, req.params.projections);

    const data = await this._installationContext.findDocumentProjectionById(id, projections);

    res.locals.installation_data = data;
    // @ts-ignore
    req.params.id = data.owner_id.toString();
    next();
  };

  getInstallation = async (req: Request, res: Response, next: NextFunction ) => {
    /* TODO: These three can be returned as an object and destructured for each middleware fn where needed.. */
    const middlewareContext = ModelContext.Installation;
    const routeProjectionsContext = res.locals.routeProjectionsContext;
    const resLocalsId = Utility.getUserId(res.locals);

    const id: number = this._installationId
      ? this._installationId
      : resLocalsId
        ? resLocalsId
        : Number(req.params.id);

    // const projections = Utility.getProjectionsByContext(req.params, this._projectionsContext);
    const projections = Utility.getProjectionsByRoute(middlewareContext, routeProjectionsContext, req.params.projections);

    try {

      res.locals.installation_data = await this._installationContext.findDocumentProjectionById(id, projections)
      console.log("RES.LOCALS INSTALLATION DATA: ", res.locals.installation_data);
    } catch (error) {

      console.error(`Failed looking up User Id with: ${id} from res.locals | req.params.id...`);
      console.error("\x1b[31m%s\x1b[0m", `octoKitApi.getInstallation failure, exiting route ${req.method} - ${req.path}`, error);
    }

    next();
  };

  postInstallation = async ({ octokit, payload }): Promise<void> => {
    console.log(`Entering octokit.api postInstallation() - `);
    const data = payload;

    try {

      await this._installationContext.findOrCreateInstallation(payload);
    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", `octokit api event handler postInstallation catch: `, error);
      throw error;
    }
  };

  //////////////////////////////
  // #endregion Installations //
  //////////////////////////////

  ////////////////////////////
  // #region Repositories ////
  ////////////////////////////

  getRepoDataById = async (req: Request, res: Response, next: NextFunction) => {
    const middlewareContext = ModelContext.Repository;
    const routeProjectionsContext = res.locals.routeProjectionsContext;
    console.log("Success calling modular getRepoDataById");

    console.log("SHOULD I PROJECT HERE? ",);
    console.log("MIDDLEWARE CONTEXT -- ", middlewareContext);
    console.log("CLASS PROJECTIONS CONTEXT -- ", routeProjectionsContext);
    console.log("REQ PARAMS PROJECTION ON URL--", req.params.projections);
    const projections = Utility.getProjectionsByRoute(middlewareContext, routeProjectionsContext, req.params.projections);

    /* TODO: make function that performs installation lookup process to all repos for install data (use in getReposById) */

    const installation = res.locals.installation_data.id
      ? res.locals.installation_data
      : await this._installationContext.findInstallationById(this._installationId);

    console.log("INSTALLATION: ", installation);

    const installationReposIds: number[] = installation.repos;

    const installationRepoDataPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
      const data = await this._repositoryContext.findDocumentProjectionById(repoId, projections);
      // @ts-ignore
      return data;
    });

    const installationRepoData = await Promise.all(installationRepoDataPromises);

    console.log("PROJECTIONS FROM PARAMS: ", projections);
    console.log("DATA: ALL repo data?? == ", installationRepoData);

    /* TODO: Only need this installation_data if next() in middleware sequence requires... */
    // res.locals.installation_data.id = this._installationId;

    res.locals.repository_data = installationRepoData;

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

    res.locals.repository_data.issues_url = issues_url;
    next();
  };

  /* TODO: needs to project .owner_id but how is it looked up? by _id or by owner_id? */
  getRepoOwnerId = async (req: Request, res: Response, next: NextFunction) => {
    throw new Error("method not implemented");
  };

  getAndPostInstallationRepos = async ({ octokit, payload }): Promise<void> => {
    try {

      /* TODO: MOVE REPOS GET? DECOUPLE FROM INSTALLATION? OR NEED TO WRITE COLLABORATORS AND ASSOCIATE WITH REPOS? SEE INSTALLATION SCHEMA */
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

  /////////////////////////////
  // #endregion Repositories //
  /////////////////////////////

  ///////////////////////////
  // #region Users //////////
  ///////////////////////////

  /**
   * @argument res.locals must contain an array of projections before entering this middleware...
   * @deprecated
   */
  getUserDataById = async (req: Request, res: Response, next: NextFunction) => {
    const middlewareContext = ModelContext.User;
    const routeProjectionsContext = res.locals.routeProjectionsContext;
    // let id: number;
    const id: number = req.params.id ? Number(req.params.id) : Utility.getUserId(res.locals);

    /* TODO: TEST if new projections and Utility call is working.. */
    // const projections: string[] = Utility.getProjectionsByContext(req.params, routeProjectionsContext);
    const projections = Utility.getProjectionsByRoute(middlewareContext, routeProjectionsContext, req.params.projections);


    try {

      const data = await this._userContext.findDocumentProjectionById(id, projections);
      res.locals.user_data = data;
      next();
    } catch (error) {
      console.error("\x1b[31m%s\x1b[0m", `try to lookup User by Id where Id === ${id}`);
      console.error("\x1b[31m%s\x1b[0m", "failure userContext.find...ById, projections: ", error);
    }
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

  getUserNameAndTypeById = async (req: Request, res: Response, next: NextFunction) => {
    const id: number = req.params.id
      ? Number(req.params.id)
      : Number(req.params.owner);

    /* TODO: IDEA: (more modular) maybe just return whole User document (rename method) and parse on C# side? */
    const data = await this._userContext
      .findDocumentProjectionById(id, [ "name", "type" ]);

    res.locals.user_data = data;

    /* get repo name from req if exists, else get it from repository_data from prev middleware assignment, else get it from next() */
    res.locals.repository_data.name = req.params.repo
      ? req.params.repo
      : res.locals.repository_data.name
        ? res.locals.repository_data.name
        : null;

    next();
  };

  //////////////////////////
  // #endregion Users //////
  //////////////////////////

  //////////////////////////
  // #region  Issues  //////
  //////////////////////////

  /**
   * @requires owner: owner_name, repo: repo_name, owner_type: typeForPath to GET issues
   */
  getIssues = async (req: Request, res: Response, next: NextFunction) => {
    const { name, owner_type } = res.locals.user_data;
    const repo_name = res.locals.repository_data.name;

    /* This formats the value associated with owner_type (installation || user) for REST url */
    const typeForPath = owner_type === "Organization" ? "orgs" : "users";
    const params: DTO.ReqProjectsParams = { owner: name, repo: repo_name, owner_type: typeForPath };

    /* TODO: DECOUPLE PROJECTS AND ISSUES LOOKUP? HOW TO DETERMINE WHICH REPO USES WHICH? */
    // #region PROJECTS
    try {

        console.log("REST {projects} URL -- ", `https://api.github.com/${params.owner_type}/${params.owner}/projects`);

        const projectsData = await this.getProjectsData(params);
        // @ts-ignore
        console.log("RAW FETCH DATA: {projects} ", projectsData.data);

      /* if projectsData found, put on res.locals... obj, then next(), else continue to 2nd Try (fetch Issues) */

    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", `fail to hit REST GET {projects}: from OctokitApi.getIssues exiting route ${req.method} - ${req.path}`);
      console.error(error);
      res.locals.repository_data.issues = null;
    }
    // #endregion PROJECTS

    // #region ISSUES
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
         * TODO: START HERE 4/7 (NEW BRANCH AFTER CLEAN UP DONE)
         * IF not exists in Backlog && Pointed Models
         * use Issues.controller or whatever to WRITE issues to Backlog Model
         */

        // const jsonIssues = await issuesData.json();

        const mappedIssues = issuesData.map((issue: any) => {
          if (issue.state === "open") {
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
          }
        });

        /**
         * @satisfies every label includes (\D\)("not digit") should be written to Backlog
         */
        const backlogIssues = issuesData.filter((issue: any) => {
          /* labels do not include any "digits" */
          return issue.labels.every((label: any) => /\D/.test(label))
        });

        /**
         * @satisfies labels include at least one (\d\)("digit") should be written to Pointed
         */
        const pointedIssues = issuesData.filter((issue: any) => {
          /* labels include a "digit" */
          return issue.labels.some((label: any) => /\d/.test(label));
        });

        /* TODO: WRITE TO MODELS -- DOES THIS NEED TO BE IN A DIFFERENT MIDDLEWARE FN? */

      res.locals.repository_data.issues = mappedIssues;

    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", `fail to hit REST GET {issues}: exiting route ${req.method} - ${req.path}`, error);
    }
    // #endregion ISSUES

    next();
  };

  getProjectsData = async (params: DTO.ReqProjectsParams) => {
    let projectsData: Partial<OctokitTypes.OrgProject | OctokitTypes.UserProject>;

      if (params.owner_type == "orgs") {
        projectsData = await this._authenticatedOctokit.request("GET /orgs/{org}/projects", {
          org: params.owner,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28"
          }
        });
      } else if (params.owner_type == "users") {
        projectsData = await this._authenticatedOctokit.request("GET /users/{username}/projects", {
          username: params.owner,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28"
          }
        });
      }

    return projectsData;
  };

  //////////////////////////
  // #endregion  Issues ////
  //////////////////////////

  //////////////////////////////
  // #region Util/Wildcard /////
  //////////////////////////////

  sendData = (req: Request, res: Response): void => {
    console.log("Ending middleware chain. Sending response");
    /* TODO: with new Global setResponseLocals middleware res.locals will always be truthy... */
    if (res.locals) {
      /* res.locals will be garbage collected at the end of every req/res cycle */
      const processedBody = res.locals;
      res.send(processedBody);
    } else {
      console.warn("res.locals is null | undefined | falsy, sending empty response body.");
      res.status(200).send();
    }
  };

  //////////////////////////////
  // #endregion Util/Wildcard //
  //////////////////////////////

  //////////////////////////////////
  // #endregion // Route Handlers //

  ///////////////////////////////
  // #region // Event Handlers //

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

    const { data } = await octokit.rest.issues.listForRepo(params);

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
      console.error("\x1b[31m%s\x1b[0m", `Error processing request: ${error.event}`);
    } else {
      console.error("\x1b[31m%s\x1b[0m", error);
    }
  };

  //////////////////////////////////
  // #endregion // Event Handlers //

}


export default new OctokitApi(_context);
