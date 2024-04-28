// @ts-nocheck
import { app } from "../app.js";
import { installationController, userController, repositoryController, issuesController } from "../db/controllers/index.js";

/* Types */
import { Request, Response, NextFunction } from "express";
// import { App as AppType, Octokit } from "octokit";

import { OAuthApp } from "@octokit/oauth-app";
// import { OAuthApp as AppType } from "@octokit/oauth-app";
import { OctokitTypes, ContextTypes, DTO, DocumentTypes } from '../types/index.js';
import { MongooseError } from "mongoose";

const _context: ContextTypes.Context = { app, installationController, userController, repositoryController, issuesController };

/* Utility Helpers */
const Utility = new (await import("../utility/index.js")).default(_context);

/**
 * Octokit Responsibilities:
 * - Get GH User info ✔
 * - - Get User data by projections ✔
 * - - Get User data by projections ✔
 * - Get Repos ✔
 * - - Get Backlogs ✔
 * - - Get associated users (repo)
 * - Post Labels == User Input story point values
 * - Get Organization (by user?)
 * - - Get associated users (org)
 * - Post/Patch story points to issues (look for label (Issues) or field (Project) with type number)
 * - Post Sprint (completed)(pending completion?)
 */

class OctokitApi {

  /**
   * @description Base-level-authenticated Octokit instance (exposes Octokit API/REST)
   */
  public readonly _appContext: OAuthApp;

  /**
   * @description All DB (Models) controllers (Unit of Work)
   */
  public readonly _installationContext: ContextTypes.InstallationController;
  public readonly _userContext: ContextTypes.UserController;
  public readonly _repositoryContext: ContextTypes.RepositoryController;
  public readonly _issuesController: ContextTypes.IssuesController;

  /**
   * @description Upgraded-level-authenticated Octokit instance from OAuth Token
   */
  public _authenticatedContext: OAuthApp;
  private _authenticatedToken: string;
  public _installationId: number;

  constructor(context: ContextTypes.Context) {
    const { app, installationController, userController, repositoryController, issuesController } = context;
    this._appContext = app;
    this._installationContext = installationController;
    this._userContext = userController;
    this._repositoryContext = repositoryController;
    this._issuesController = issuesController;
  }

  /////////////////////////////////////////////////////////////////////////////
  // #region /////////////////////// Route Handlers ///////////////////////////

  //////////////////////////////////////////
  // #region /////// Installations /////////
  //////////////////////////////////////////

  /**
   *
   */
  // postAuth = async (req: Request, res: Response, next: NextFunction) => {
  //   const id: number = req.params.id ? Number(req.params.id) : req.body.installationId;
  //   this._installationId = id;
  //   console.log("installation ID inside getAuth == ", id);

  //   /* The following will be if OAuth Token/session validation is needed... */
  //   // #region Auth Session
  //   // const token = await this._appContext.oauth.createToken({ code }); // replace with this._authenticatedOctokit ?
  //   // const authObj = this._appContext.oauth.getUserOctokit({ code });

  //   /* get installation document from DB? */
  //   // installation.token = token;
  //   // installation.save();
  //   // new up auth octokit (OAuth/Auth/App)
  //   // #endregion

  //   /* Upgrade this._appContext octokit Instance to Authenticated Installation Instance */
  //   // TODO: GRAB REQUIRED DATA FROM AUTH TO LOOKUP USER.UUID? USERNAME? NAME FIRST/LAST? AVATAR URL?
  //   const { data: slug } = await this._appContext.octokit.rest.apps.getAuthenticated();

  //   // ********** // this._authenticatedOctokit.rest.repos.listForUser(); // ***********

  //   /* option 1 */
  //   // this._appContext.octokit.rest.repos.listCollaborators();
  //   // write collaborators (_ids) to Users table in DB
  //   // write users._ids to Installation.collaborators
  //   // this should give collaborator/users access to specific repo

  //   /* option 2 */
  //   // this._appContext.octokit.rest.repos.listCollaborators();
  //   // write these collaborators to Installation.collaborators in DB
  //   // generate UUID/key (user distributes)

  //   try {

  //     this._authenticatedOctokit = await this._appContext.getInstallationOctokit(id);

  //     console.log("Successfully Authenticated and Upgraded Octokit...")
  //     res.status(200);
  //     next();
  //   } catch (error) {

  //     console.error("\x1b[31m%s\x1b[0m", "failed to authenticate and upgrade octokit: ", error);
  //     res.sendStatus(500);
  //   }
  // };

  /////////////////////////////////////////////////////
  //////////// WRITING ////////////////////////////////
  /////////////////////////////////////////////////////

  postAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code: string = req.body.code;

      /* { authentication } obj contains lots of client data */
      const { authentication } = await this._appContext
        .createToken({
          code,
          scopes: [ "project", "read:user", "repo" ],
        });

      const { token }: { token: string } = authentication;
      res.locals.authorization = token;

    } catch (error) {

      console.error(`this is req.body.code: ${req.body.code} inside postAuth...`);
      console.error("Failed to upgrade with _appContext.createToken: ", error);
    }

    next();
  };

  getOrPostUser = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization: token} = res.locals;

    if (token === null || token === undefined) {
      const log = "OAuth token is null or undefined, please authenticate user...";
      console.error(log);
      res.status(403).send(log);
    }

    try {
      /* full OAuth User from REST (extensive use from this obj if needed) */
        const { data: user }: { user: OctokitTypes.OAuthUser } = await this._authenticatedContext.request("GET /user");
        console.log(`GET USER DATA OAUTH APP --`, user);

        const userDTO: DTO.User = this._userContext.mapUserDTO(user);
        const userDoc: DocumentTypes.User = await this._userContext.findOrCreate(userDTO);

        res.locals.user_data = userDoc;

      } catch (error) {

        if (error instanceof MongooseError) {
          console.error("Error performing database operation: ", error);
        } else {
          console.error("Error fetching user data from REST: ", error);
        }

        res.locals.user_data = null;
        res.status(500);
    }

    next();
  };

  getUserRepos = async (req: Request, res: Response, next: NextFunction) => {
    /* TODO: needs pagination for users with LOTS of repos.. */
    console.log("--- --- --- ---");
    // console.log(res.locals.user_data);
    const user = res.locals.user_data;
    const { repos_url } = res.locals.user_data;
    console.log(`REPOS URL INSIDE getUserRepos: ${repos_url}`);

    try {

      const { data: repos } = await this._authenticatedContext.request("GET /user/repos");
      repos.forEach(repo => {
        console.log(repo);
      });
      // for (const key in repos) {
      //   console.log(`KEY: ${key}`);
      //   console.log(`VAL: ${repos[key]}`);
      // }
      // console.log(`REPOS REPOS REPOS -->> ${repos}`);
    } catch (error) {
      console.error("Failed to GET /repositories REST ", error);
    }

    next();
  };

  // TODO: Write user data to DB -->> then use some user data to go get associated repos? -->> write those to user?
  // TODO: Move to respective regions of API class

  /////////////////////////////////////////////////////
  //////// END WRITING ////////////////////////////////
  /////////////////////////////////////////////////////






  /* TODO: this can be made into a wildcard fn for all controllers (controller string as arg to specify) */
  /**
   * @deprecated
   */
  getInstallationDataById = async (req: Request, res: Response, next: NextFunction) => {
    const middlewareContext = ContextTypes.ModelContext.Installation;
    const routeProjectionsContext = res.locals.routeProjectionsContext;
    const id: number = Number(req.params.id);
    // const projections: string[] = Utility.getProjectionsByContext(req.params, this._projectionsContext);
    const projections = Utility.determineIfProjectionsNeeded(middlewareContext, routeProjectionsContext, req.params.projections);

    const data = await this._installationContext.findDocumentProjectionById(id, projections);

    res.locals.installation_data = data;
    // @ts-ignore
    req.params.id = data.owner_id.toString();
    next();
  };

  getInstallation = async (req: Request, res: Response, next: NextFunction ) => {
    const { middlewareContext, routeProjectionsContext } = Utility.getQueryContext(ContextTypes.ModelContext.Installation, res.locals);
    const resLocalsId = Utility.getUserId(res.locals);

    const id: number = this._installationId
      ? this._installationId
      : resLocalsId
        ? resLocalsId
        : Number(req.params.id);

    const projections = Utility.determineIfProjectionsNeeded(middlewareContext, routeProjectionsContext, req.params.projections);

    try {

      res.locals.installation_data = await this._installationContext.findDocumentProjectionById(id, projections)
      console.log("RES.LOCALS INSTALLATION DATA: ", res.locals.installation_data);
    } catch (error) {

      console.error(`Failed looking up User Id with: ${id} from res.locals | req.params.id...`);
      console.error("\x1b[31m%s\x1b[0m", `octoKitApi.getInstallation failure, exiting route ${req.method} - ${req.path}`, error);
    }

    next();
  };

  //////////////////////////////////////////
  // #endregion ////// Installations ///////
  //////////////////////////////////////////

  //////////////////////////////////////////
  // #region /////// Repositories //////////
  //////////////////////////////////////////

  getRepoDataById = async (req: Request, res: Response, next: NextFunction) => {
    const { middlewareContext, routeProjectionsContext } = Utility
      .getQueryContext(ContextTypes.ModelContext.Repository, res.locals);

    const projections = Utility
      .determineIfProjectionsNeeded(middlewareContext, routeProjectionsContext, req.params.projections);

      try {

        const installation = res.locals.installation_data.repos.length
        ? res.locals.installation_data
        : await this._installationContext.findInstallationById(this._installationId);

        console.log("INSTALLATION: ", installation);

        const installationReposIds: number[] = installation.repos;

        const installationRepoDataPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
          return await this._repositoryContext.findDocumentProjectionById(repoId, projections);
      });

      const installationRepoData = await Promise.all(installationRepoDataPromises);

      console.log("PROJECTIONS FROM PARAMS: ", projections);
      console.log("DATA: ALL repo data?? == ", installationRepoData);

      /* TODO: Only need this installation_data if next() in middleware sequence requires... */
      // res.locals.installation_data.id = this._installationId;

      res.locals.repository_data = installationRepoData;

      } catch (error) {

        console.error("\x1b[31m%s\x1b[0m", `octoKitApi.getRepoDataById failure, exiting route ${req.method} - ${req.path}`, error);
      }

    next();
  };

  /* TODO: make function that performs installation lookup process to all repos for install data (use in getReposById) */
  getReposByInstallationId = async (req: Request, res: Response, next: NextFunction) => {
    let id: number;

    try {
      id = this._installationId
        ? this._installationId
        : req.params.id
          ? Number(req.params.id)
          : res.locals.installation_data.id;

        } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", `route ${req.method} - ${req.path}`);
      console.error("getReposByInstallationId installation id is null.", error);
      res.sendStatus(404);
    }

    try {

      const installation = res.locals.installation_data.repos?.length
          ? res.locals.installation_data
          : await this._installationContext.findInstallationById(id);
      const installationReposIds: number[] = installation.repos;

      try {

        /* .repos and .repositories are distinct, repositories includes ALL repo data */
        res.locals.installation_data.repositories = await this._repositoryContext.find({ _id: { $in: installationReposIds } });

      } catch (error) {

        console.error(`Failed to find repositories by these repo ids ${installationReposIds}`, error);
        res.locals.installation_data = installation;

      }
    } catch (error) {

      console.error(`installation ${id} does not exist in DB`);
      res.sendStatus(404);
    }

    next();
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

  //////////////////////////////////////////
  // #endregion ////// Repositories ////////
  //////////////////////////////////////////

  //////////////////////////////////////////
  // #region /////////// Users /////////////
  //////////////////////////////////////////

  /**
   * @argument res.locals must contain an array of projections before entering this middleware...
   */
  getUserDataById = async (req: Request, res: Response, next: NextFunction) => {
    const { middlewareContext, routeProjectionsContext } = Utility.getQueryContext(
      ContextTypes.ModelContext.User,
      res.locals
    );

    const id: number = req.params.id
      ? Number(req.params.id)
      : Utility.getUserId(res.locals);

    const projections = Utility.determineIfProjectionsNeeded(
        middlewareContext,
        routeProjectionsContext,
        req.params.projections
      );

    try {

      const data = await this._userContext.findDocumentProjectionById(id, projections);
      res.locals.user_data = data;
      next();
    } catch (error) {
      console.error("\x1b[31m%s\x1b[0m", `try to lookup User by Id where Id === ${id}`);
      console.error("\x1b[31m%s\x1b[0m", "failure userContext.find...ById, projections: ", error);
    }
  };

  getUserNameAndTypeById = async (req: Request, res: Response, next: NextFunction) => {
    const id: number = req.params.id
      ? Number(req.params.id)
      : Number(req.params.owner);
    console.log(`user id on req: ${id}`);
    const data = await this._userContext
      .findDocumentProjectionById(id, [ "name", "type" ]);

    res.locals.user_data = data;

    next();
  };

  getRepoNameByUserIdOrParam = async (req: Request, res: Response, next: NextFunction) => {
    const id: number = req.params.id
      ? Number(req.params.id)
      : req.params.owner
        ? Number(req.params.owner)
        : Number(res.locals.user_data._id);

    /* get repo name from req if exists, else get it from repository_data from prev middleware assignment, else get it from next() */
    res.locals.repository_data.name = req.params.repo
      ? req.params.repo
      : res.locals.repository_data.name
        ? res.locals.repository_data.name
        : await this._repositoryContext.findRepoNameByOwnerId(id); // TODO: this could be a problem if owner has multiple repos...

    next();
  };

  getOrganizationMembers = async (req: Request, res: Response, next: NextFunction) => {
    const { owner } = Utility.processParamsForRestUsers(res.locals);

    /* option 1 */
    // write collaborators (_ids) to Users table in DB
    // write users._ids to Installation.collaborators
    // this should give collaborator/users access to specific repo

    /* option 2 */
    // write these collaborators to Installation.collaborators in DB
    // generate UUID/key (user distributes)

    // const { data } = await this._authenticatedOctokit.rest.users.list();
    // const { data } = await this._authenticatedOctokit.rest.orgs.get();

    ///////////////////////////////////////////////
    // auth upgrade installation id === 49816043 //
    // TODO: undo hardcode auth upgrade ///////////
    this._authenticatedOctokit = await this._appContext.getInstallationOctokit(49816043);

    try {

      const { data } = await this._authenticatedOctokit.rest.orgs.listMembers({ org: owner });

      res.locals.user_data = data;
    } catch (error) {

      console.error(`ORGANIZATION MEMBERS -- Failure listMembers REST request to GH -- ${owner}`);
    }

    next();
  };

  getRepoContributors = async (req: Request, res: Response, next: NextFunction) => {
    const { repo, owner } = Utility.processParamsForRestUsers(res.locals);

    ///////////////////////////////////////////////
    // auth upgrade installation id === 49816043 //
    // TODO: undo hardcode auth upgrade ///////////
    this._authenticatedOctokit = await this._appContext.getInstallationOctokit(49816043);

    try {

      const { data } = await this._authenticatedOctokit.rest.repos.listCollaborators({ owner, repo });

      res.locals.user_data = data;
    } catch (error) {

      console.error(`REPOSITORY COLLABORATORS -- Failure listCollaborators REST request to GH -- ${owner} + ${repo}`);
    }

    next();
  };

  /**
   * @description write COLLABORATORS and MEMBERS to DB? TWO distinct POSTS? hook into GET routes???
   */
  postAssociatedUsers = async (req: Request, res: Response, next: NextFunction) => {
    throw new Error("Not Implemented");
  };

  //////////////////////////////////////////
  // #endregion //////// Users /////////////
  //////////////////////////////////////////

  //////////////////////////////////////////
  // #region //////// Issues  //////////////
  //////////////////////////////////////////

  /**
   * @requires owner: owner_name, repo: repo_name, owner_type: typeForPath to GET issues
   */
  getIssues = async (req: Request, res: Response, next: NextFunction) => {
    const params = Utility.processParamsForRestUsers(res.locals);
    console.log("PARAMS:", params);

    /* TODO: *important* If a repo has a backlog, an indicator needs to be cached! this will prevent lookup */
    /* TODO: Look to repository.model has_backlog and has_pointed for pseudo caching or checking instead of looking up... */
    let backlogDocuments = await this._issuesController.findBacklog(params.repo);
    console.log(`Backlog found from DB lookup in API getIssues...`);
    console.log(backlogDocuments);

    if (backlogDocuments !== null) {
      res.locals.repository_data.backlog_issues = backlogDocuments;

    } else {

      try {

          // const { data: restIssues } = await this._authenticatedOctokit.rest.issues.listForRepo(params);
          const { data: restIssues } = await this._authenticatedOctokit.octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner: params.owner,
            repo: params.repo,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28"
            }
          });

          console.log("--------------------- REST JAS BEEN CALLED ------------");

          // console.log("RAW ISSUES DATA FROM REQUEST: ", restIssues);
          // const jsonIssues = await restIssues.json();

          /* TODO: WRITE TO MODELS -- DOES THIS NEED TO BE IN A DIFFERENT MIDDLEWARE FN? */
          backlogDocuments = await this._issuesController
            .createBacklogForRepoIfNotExists(restIssues, params.repo);

          /* fallback case: backlog already exists in DB */
          if (backlogDocuments === null) {

            res.locals.repository_data.backlog_issues = await this._issuesController.findBacklog(params.repo);
          } else {

            res.locals.repository_data.backlog_issues = backlogDocuments;
          }

        // TODO: HANDLE WRITE AND FIND FOR POINTED ISSUES 4/9
        // res.locals.repository_data.pointed_issues = pointedDocuments;

      } catch (error) {

        console.error("\x1b[31m%s\x1b[0m", `fail to hit REST GET {issues}: exiting route ${req.method} - ${req.path}`, error);
      }
    }

    next();
  };

  /**
   * @param params ```{ owner: owner-name, repo: repo-name, owner_type: "orgs" | "users" }```
   * @summary IF a repo has issue data via projects (determine this somehow?)
   * @description When labels are added data.changes.field_value.field_type === "labels"?
   */
  getProjectsData = async (req: Request, res: Response, next: NextFunction) => {
    /* TODO: HOW TO DETERMINE WHICH REPO USES PROJECTS/ISSUES? */
    const params = Utility.processParamsForRestUsers(res.locals);
    let projectsData: Partial<OctokitTypes.OrgProject | OctokitTypes.UserProject>;

    try {

      console.log("REST {projects} URL -- ", `https://api.github.com/${params.owner_type}/${params.owner}/projects`);

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

      // @ts-ignore
      console.log("RAW FETCH DATA: {projects} ", projectsData.data);

    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", `fail to hit REST GET {projects}: from OctokitApi.getIssues exiting route ${req.method} - ${req.path}`);
      console.error(error);
      projectsData = null;
    }

    res.locals.repository_data.projects = projectsData;
    next();
  };

  //////////////////////////////////////////
  // #endregion ///////// Issues ///////////
  //////////////////////////////////////////


  //////////////////////////////////////////
  // #region /////// Util/Wildcard /////////
  //////////////////////////////////////////

  sendData = (req: Request, res: Response): void => {
    console.log("\x1b[38;5;208m%s\x1b[0m","Ending middleware chain. Sending response");
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

  //////////////////////////////////////////
  // #endregion ////// Util/Wildcard ///////
  //////////////////////////////////////////

  //////////////////////////////////////////
  // #endregion ////// Route Handlers //////

  /////////////////////////////////////////////////////////////////////////////
  // #region /////////////////////// Event Handlers ///////////////////////////

  handleAuthTokenUpgrade = async ({ token, octokit }): Promise<void> => {
    // @ts-ignore
    this._authenticatedToken = token;
    // @ts-ignore
    this._authenticatedContext = octokit;
  };

  handleInstallationCreate = async ({ octokit, payload }): Promise<void> => {
    console.log(`Entering octokit.api handleInstallationCreate() for - ${payload.installation.account.login}`);

    try {

      await this._installationContext.findOrCreateInstallation(payload);
    } catch (error) {

      console.error("\x1b[31m%s\x1b[0m", `octokit api event handler handleInstallationCreate catch: `, error);
      throw error;
    }
  };

  handleInstallationReposFindOrCreate = async ({ octokit, payload }): Promise<void> => {
    try {

      /* TODO: MOVE REPOS GET? DECOUPLE FROM INSTALLATION? OR NEED TO WRITE COLLABORATORS AND ASSOCIATE WITH REPOS? SEE INSTALLATION SCHEMA */
      /* TODO: what is the equivalent of res.locals for event handlers? */
      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
      const { repositories } = data;

      const documents = await this._repositoryContext.createInstallationRepositories(repositories);

    } catch (error) {

      console.error(`FAILED to READ or WRITE to DB at .rest.apps.listReposAccess...()`, error);
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

  handleOwnerUserCreate = async ({ payload }): Promise<void> => {
    const { installation }: { installation: OctokitTypes.Installation, } = payload;
    const { account }: { account: OctokitTypes.User } = installation;

    try {

      await this._userContext.createUser(account, false, true);
    } catch (error) {

      if (!installation || !account) {
        console.error(`Null value on payload for handleOwnerUserCreate`, error);
        throw error;
      }

      console.error(`Internal server error from handleOwnerUserCreate octokit.api:`, error);
      throw error;
    }
  };

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

  /////////////////////////////////////////////////////////////////////////////
  // #endregion /////////////////////// Event Handlers ////////////////////////

}

/////////////////////////////////////////////////////////////////////////////
//// TEMP EVENT REGISTRATION ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

// this._appContext.on("token.created", async ({ token, octokit }) => {
//   this._authenticatedToken = token;
//   this._authenticatedContext = octokit;
//   const { data } = octokit.request("GET /user");
//   console.log("DATA FUCKER: ", data);
// });

export default new OctokitApi(_context);
