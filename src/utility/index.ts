import { UserController } from "../db/controllers/user.controller.js";
import { Context, UserProperties } from '../types/context.js';

interface PayloadDTO {
  [key: string]: any;
}

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
    try {
      return obj.user_data
        ? obj.user_data.name
        : obj.repository_data
          ? obj.repository_data.full_name.split("/")[0]
          : obj.installation_data
            ? obj.installation_data
            : obj.installation_data.owner_name
    } catch (error) {
      throw new Error("res.locals data not exists, exiting Utilities getUserName");
    }
  };

  getUserType = (obj: any) => {
    return obj.user_data
      ? obj.user_data.type
      : obj.installation_data
        ? obj.installation_data.type
        : null // error condition
  };

  enumContainsValue = <T extends Record<string, string>>(value: string, properties: T): boolean => {
    for (const key in properties) {
      if (properties[key as keyof T] === value) {
        return true;
      }
    }
    return false;
  }

  findEmptyObjectKey = (locals: any) => {
    for (const key in locals) {
        if (Object.keys(locals[key]).length === 0 && locals[key].constructor === Object) {
            return key; // Return the key of the empty object
        }
    }
    return null; // Return null if no empty object is found
  };

  deleteEmptyObject = (locals: any) => {
    const emptyObjectKey = this.findEmptyObjectKey(locals);
    if (emptyObjectKey !== null) {
        delete locals[emptyObjectKey]; // Delete the empty object
        return true; // Return true if an empty object is deleted
    }
    return false; // Return false if no empty object is found
  };

}
