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

  findOrCreate = async<T extends DTO.User>(user: T): Promise<DocumentTypes.User> => {
    const { id }: { id: number } = user;

    try {

      const userDoc: DocumentTypes.User = await this.findOne({ _id: id });

      return userDoc !== null
        ? userDoc
        : await this.createUser(user);

    } catch (error) {

      console.error(`Controller ${this._model.modelName} findOne call failed for id: ${id}`);
      console.error(error);
      throw error;
    }
  };

  createUser = async<T extends DTO.User>(
    { id, type, name, avatar_url, repos_url, repos }: T,
    ): Promise<DocumentTypes.User> => {

    try {
      const user: DocumentTypes.User = await this._model.create({
        _id: id,
        type,
        name,
        avatar_url,
        repos_url,
        repos
       });

      return user;
    } catch (error) {

      console.error("Failure to create owner user on User Mode: method: createUser", error);
      throw error;
    }
  };

  userIsOwner = async (id: number): Promise<boolean> => await this._model.findById(id, "app_owner");

  mapUserDTO = <T extends OctokitTypes.OAuthUser | DTO.User | DocumentTypes.User>(restUser: T): DTO.User => {
    const id = "id" in restUser ? restUser.id : restUser._id;
    const { name, avatar_url, repos_url, type } = restUser;
    const repos = [];
    return { id, name, avatar_url, repos_url, type, repos };
  };

};

export default UserController;