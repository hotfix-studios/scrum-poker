import { ARepository } from "./base/ARepository.js";
import { Schema, Model, FilterQuery, HydratedDocument } from "mongoose";
// import * as OctokitTypes from "../../types/octokit.js";
import { DTO, OctokitTypes, DocumentTypes } from "../../types/index.js";


///////////////////// /////////////////////
//// - CRUD USE: //// //// - HTTP USE: ////
//// - Create... //// //// - Post...   ////
//// - Find...   //// //// - Get...    ////
//// - Update... //// //// - Patch...  ////
//// - Delete... //// //// - Delete... ////
///////////////////// /////////////////////

/**
 * This will be the Repository for User Model (CRUD)
 */
export class UserController extends ARepository {

  constructor(model: Model<any>) {
    super(model);
  }

  findOrCreate = async<T extends DocumentTypes.User | OctokitTypes.OAuthUser>(user: T): Promise<DocumentTypes.User> => {
    const _id = "id" in user ? user.id : user._id;

    try {

      const userDoc: DocumentTypes.User = await this.findOne({ _id });

      return userDoc !== null
        ? userDoc
        : await this.createUser(user);

    } catch (error) {

      console.error(`Controller ${this._model.modelName} findOne call failed for id: ${_id}`);
      console.error(error);
      throw error;
    }
  };

  createUser = async<T extends OctokitTypes.OAuthUser | DocumentTypes.User>(
    user: T,
    ): Promise<DocumentTypes.User> => {

    const userDoc = this.mapUserDocument(user);

    try {
      const user: DocumentTypes.User = await this._model.create(userDoc);

      return user;
    } catch (error) {

      console.error("Failure to create owner user on User Mode: method: createUser", error);
      throw error;
    }
  };

  userIsOwner = async (id: number): Promise<boolean> => await this._model.findById(id, "app_owner");

  mapUserDocument = <T extends OctokitTypes.OAuthUser | DocumentTypes.User>(restUser: T): DocumentTypes.User => {
    const _id = "id" in restUser ? restUser.id : restUser._id;
    const { name, avatar_url, repos_url, type } = restUser;
    const repos = [];
    return { _id, name, avatar_url, repos_url, type, repos };
  };

  mapUserDTO = ({ id, name, avatar_url }: OctokitTypes.OAuthUser): DTO.User => ({ _id: id, name, avatar_url });

};

export default UserController;