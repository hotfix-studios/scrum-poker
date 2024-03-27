import { User } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";

import { Request, Response } from "express";
import { Schema, Model, FilterQuery } from "mongoose";
import * as OctokitTypes from "../../types/octokit.js";

/**
 * This will be the Repository for User Model (CRUD)
 */
export class UserController extends ARepository {

  constructor(model: Model<any>) {
    super(model);
    // this._model = model;
  }

  createUser = async (
    { id, type, login, avatar_url }: OctokitTypes.User,
    isHost: boolean = false,
    isOwner: boolean = false
    ): Promise<boolean> => {

    try {
      const user = await this._model.create({
        _id: id,
        type,
        name: login,
        avatar_url,
        game_host: isHost,
        app_owner: isOwner
       });

      return user ? true : false;
    } catch (error) {

      console.error("Failure to create owner user on User Mode: method: createUser", error);
      return false;
    }
  };

  userIsOwner = async (id: number): Promise<boolean> => await this._model.findById(id, "app_owner");

};

export default UserController;