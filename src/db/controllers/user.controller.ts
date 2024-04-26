import { ARepository } from "./base/ARepository.js";
import { Schema, Model, FilterQuery } from "mongoose";
// import * as OctokitTypes from "../../types/octokit.js";
import { DTO, OctokitTypes } from "../../types/index.js";


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

  findOrCreate = async (user: OctokitTypes.OAuthUser) => {
    const { id }: { id: number } = user;

    try {

      const userDoc = await this.findOne({ _id: id });

      if (userDoc !== null) {

        return userDoc;

      } else { /* user needs to be created.. */

        const userDTO: DTO.User = this.mapUserDTO(user);
        return await this.createUser(userDTO);
      }

    } catch (error) {

      console.error(`Controller ${this._model.modelName} findOne call failed for id: ${id}`);
      console.error(error);
      throw error;
    }
  };

  createUser = async (
    { id, type, name, avatar_url, repos_url, repos }: DTO.User,
    ): Promise<typeof this._model> => {

    try {
      const user = await this._model.create({
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

  mapUserDTO = (restUser: OctokitTypes.OAuthUser): DTO.User => {
    const { id, name, avatar_url, repos_url, type } = restUser;
    const repos = [];
    return { id, name, avatar_url, repos_url, type, repos };
  };

};

export default UserController;