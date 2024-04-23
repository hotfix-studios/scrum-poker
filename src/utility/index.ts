import { Context, UserProperties } from '../types/context.js';
/* TODO: maybe Utils class should perform any DB operations or require any Models... */
import { UserController } from "../db/controllers/user.controller.js";
import { DTO } from '../types/index.js';

interface PayloadDTO {
  [key: string]: any;
}

/**
 * @description This Class parses lookup data from possible res.locals
 */
export default class Utils {

  public readonly _userContext: UserController;
  private _userProperties: typeof UserProperties;

  constructor(context: Context) {
    this._userProperties = UserProperties;
    this._userContext = context.userController;
  }

  findOwnerId = async (payload: PayloadDTO): Promise<number | null> => {
    return await this.recursePayload(payload);
  };

  recursePayload = async (payload: PayloadDTO): Promise<number | null> => {
    for (const key in payload) {
      // if false, will skip prototype props and continue to next key in payload
      console.log(`Key: ${key}`);
      if (payload.hasOwnProperty(key)) {
        const value = payload[key];
        console.log(`Value: ${value}`);
        if (this.enumContainsValue(key, this._userProperties)) {
          // grab id on key (key.id)
          const userQueryId = payload[key].id;
          console.log(`Id of User found: ${userQueryId}`);
          // check user document for .IsOwner === true
          const userIsOwner = await this._userContext.userIsOwner(userQueryId);
          if (userIsOwner) {
            // if .IsOwner === true return document._id
            console.log(`found owner: ${userIsOwner}: ${userQueryId}`);
            return userQueryId;
          }
        } else if (typeof value === "object" && value !== null) {
          console.log(`recursing on ${value}`);
          const foundOwnerId = await this.recursePayload(value);
          if (foundOwnerId !== null) {
            return foundOwnerId;
          }
        } else {
          continue;
        }
      }
    }
    return null;
  };

  /**
   * @summary Checks if current middleware needs to apply projections from url path (http req)
   * @param middlewareContext The context of the current middleware (installation, repository, user, etc)
   * @param routeContext The target context for projections to be applied (based on req url path)
   * @param urlProjections The actual projections to apply to DB ops
   * @returns string[] for model query projections
   */
  determineIfProjectionsNeeded = (middlewareContext: string, routeContext: string, urlProjections: string): string[] => {
    return middlewareContext === routeContext ? urlProjections?.split(",") : [];
  };

  /**
 *
 * @param middlewareContext string from Enum representing current middleware context
 * @param resLocals temporary route variables returning routeProjectionsContext from route endpoint
 * @example /api/REPOS/names/:projections
 * @returns object used to determine if current middleware DB query needs route projections
 */
  getQueryContext = (middlewareContext: string, resLocals: any): DTO.HttpProjectionsContexts => {
    return { middlewareContext: middlewareContext, routeProjectionsContext: resLocals.routeProjectionsContext }
  };

/**
 * @deprecated
 * @summary utility to conditionally parse projection string[] for intended model specified by context
 * @param resLocals (will have projections string[])
 * @param targetContext string in "singular-tense" representing target db context (Model) name
 * @returns string[] for model query projections
 */
  getProjectionsByContext = (resLocals: any, targetContext: string = ""): string[] | [] => {
    resLocals.projections = resLocals.projections ? resLocals.projections : [];
    const context = targetContext.toLowerCase();

    return context === "installation" || context === "installations"
      ? resLocals.installation_projections
      : context === "repository" || context === "repos"
        ? resLocals.repository_projections
        : context === "user" || context === "users"
          ? resLocals.user_projections
          : context === "issue" || context === "issues"
            ? resLocals.issues_projections
          : context === "room" || context === "rooms"
            ? resLocals.room_projections
            : resLocals.projections;
  };

  /**
   * @description there may be edge cases if user_ids are appended from different router models...
   * @todo append "flag" pre-Next() i.e.: res.locals.prev = "user" where res.locals.user_data was just appended...
   * @param resLocals temporary object with relevant data for route
   * @example res.locals.installation_data -> will have one owner ID
   * @example res.locals.repository_data -> this will have an owner BUT will also have collaborators with IDs
   * @example res.locals.user_data -> will have one owner ID
   */
  getUserId = (resLocals: any): number | null => {
    return resLocals.installation_data.owner_id
      ? resLocals.installation_data.owner_id
      : resLocals.repository_data.owner_id
        ? resLocals.repository_data.owner_id
        : resLocals.user_data._id
          ? resLocals.user_data._id
          : null;
  };

  getUserName = (resLocals: any): string | null => {
    return resLocals.user_data.name
      ? resLocals.user_data.name
      : resLocals.repository_data.full_name
        ? resLocals.repository_data.full_name.split("/")[0]
        : resLocals.installation_data.owner_name
          ? resLocals.installation_data.owner_name
          : null;
  };

  getUserType = (resLocals: any): string | null => {
    return resLocals.user_data
      ? resLocals.user_data.type
      : resLocals.installation_data
        ? resLocals.installation_data.type
        : null;
  };

  getRepoName = (resLocals: any): string | null => {
    return resLocals.repository_data.name
      ? resLocals.repository_data.name
      : resLocals.issues_data.repository_name
        ? resLocals.issues_data.repository_name
        : null;
  };

  processParamsForRestIssues = (resLocals: any): DTO.ReqProjectsParams => {
    const { name, owner_type } = resLocals.user_data;
    const repo_name = resLocals.repository_data.name;
    const typeForPath = owner_type === "Organization" ? "orgs" : "users";
    const params: DTO.ReqProjectsParams = { owner: name, repo: repo_name, owner_type: typeForPath };
    return params;
  };

  enumContainsValue = <T extends Record<string, string>>(value: string, properties: T): boolean => {
    for (const key in properties) {
      if (properties[key as keyof T] === value) {
        return true;
      }
    }
    return false;
  }

  findEmptyObjectKey = (obj: any) => {
    for (const key in obj) {
        if (Object.keys(obj[key]).length === 0 && obj[key].constructor === Object) {
            return key; // Return the key of the empty object
        }
    }
    return null; // Return null if no empty object is found
  };

  deleteEmptyObject = (obj: any) => {
    const emptyObjectKey = this.findEmptyObjectKey(obj);
    if (emptyObjectKey !== null) {
        delete obj[emptyObjectKey]; // Delete the empty object
        return true; // Return true if an empty object is deleted
    }
    return false; // Return false if no empty object is found
  };

}
