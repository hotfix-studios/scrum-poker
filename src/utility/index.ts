import { Context, UserProperties } from '../types/context.js';
/* TODO: maybe Utils class should perform any DB operations or require any Models... */
import { UserController } from "../db/controllers/user.controller.js";

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
  getProjectionsByRoute = (middlewareContext: string, routeContext: string, urlProjections: string): string[] => {
    return middlewareContext === routeContext ? urlProjections?.split(",") : [];
  };

/**
 * @deprecated
 * @summary utility to conditionally parse projection string[] for intended model specified by context
 * @param obj req.body (will have projections string[])
 * @param targetContext string in "singular-tense" representing target db context (Model) name
 * @returns string[] for model query projections
 */
  getProjectionsByContext = (obj: any, targetContext: string = ""): string[] | [] => {
    obj.projections = obj.projections ? obj.projections : [];
    const context = targetContext.toLowerCase();

    return context === "installation" || context === "installations"
      ? obj.installation_projections
      : context === "repository" || context === "repos"
        ? obj.repository_projections
        : context === "user" || context === "users"
          ? obj.user_projections
          : context === "issue" || context === "issues"
            ? obj.issues_projections
          : context === "room" || context === "rooms"
            ? obj.room_projections
            : obj.projections;
  };

  /**
   * @description there may be edge cases if user_ids are appended from different router models...
   * @todo append "flag" pre-Next() i.e.: res.locals.prev = "user" where res.locals.user_data was just appended...
   * @param obj res.locals.installation_data -> will have one owner ID
   * @param obj res.locals.repository_data -> this will have an owner BUT will also have collaborators with IDs
   * @param obj res.locals.user_data -> will have one owner ID
   */
  getUserId = (obj: any): number | null => {
    return obj.installation_data.owner_id
      ? obj.installation_data.owner_id
      : obj.repository_data.owner_id
        ? obj.repository_data.owner_id
        : obj.user_data._id
          ? obj.user_data._id
          : null;
  };

  getUserName = (obj: any): string | null => {
    return obj.user_data.name
      ? obj.user_data.name
      : obj.repository_data.full_name
        ? obj.repository_data.full_name.split("/")[0]
        : obj.installation_data.owner_name
          ? obj.installation_data.owner_name
          : null;
  };

  getUserType = (obj: any): string | null => {
    return obj.user_data
      ? obj.user_data.type
      : obj.installation_data
        ? obj.installation_data.type
        : null;
  };

  getRepoName = (obj: any): string | null => {
    return obj.repository_data.name
      ? obj.repository_data.name
      : obj.issues_data.repository_name
        ? obj.issues_data.repository_name
        : null;
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
