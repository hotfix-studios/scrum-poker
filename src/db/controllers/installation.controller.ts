import { Installation, Repository } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";
import { Request, Response } from "express";
import { Schema, Model, FilterQuery, Document } from "mongoose";
import * as OctokitTypes from '../../types/octokit.js';

///////////////////// /////////////////////
//// - CRUD USE: //// //// - HTTP USE: ////
//// - Create... //// //// - Post...   ////
//// - Find...   //// //// - Get...    ////
//// - Update... //// //// - Patch...  ////
//// - Delete... //// //// - Delete... ////
///////////////////// /////////////////////

/**
 * This will be the Repository for App Installation Model (CRUD)
 */
export class InstallationController extends ARepository{

  constructor(model: Model<any>) {
    super(model);
  }

  // TODO: Look into how .populate("model") will be used for aggregates

  /**
   * @summary should only ever be one installation per client?
   * @param number owner id, not the primary key _id
   * @returns installation id
   */
  findInstallationIdByOwnerId = async (id: number) => {
    return await this._model.findOne({ owner_id: id }, "_id");
  }

  findInstallationById = async (id: number): Promise<any> => {
    return await this._model.findById(id);
  };

  findOrCreateInstallation = async (payload) => { // return type Promise<typeof Installation>
    try {

      let _installation = await this.socketFindOneById(payload.installation.id); // _installation: typeof Installation | null
      let _repositories: any[];

      if (_installation === null) {

        const { installation, repositories }: { installation: OctokitTypes.Installation, repositories: OctokitTypes.Repository[] } = payload;
        const { id, target_id, target_type, account } = installation;
        const { login, organizations_url, repos_url } = account;

        /* available data for repo on installation */
        // {
        //   _id: repo.id,
        //   name,
        //   full_name,
        //   private: repo.private
        // }

        /* maps repos for installation document to array of owner_ids */
        if (repositories.length) _repositories = repositories.map((repo: any) => repo.id);

        /* TODO: make Partial or VM for DTO type */
        const _insertInstallation = { // insertInstallation: Partial<typeof Installation>
          _id: id,
          owner_name: login,
          owner_id: target_id,
          type: target_type,
          orgs_url: organizations_url,
          repos_url: repos_url,
          repos: _repositories
        }

        try {

          _installation = await this._model.create(_insertInstallation);

        } catch (error) {

          console.error("BONK:", error);

        }

        console.log("Installation created and saved!");
        return _installation;

      } else {

        console.log("Installation found.");
        return _installation;

      }

    } catch (error) {

      console.error("Internal Server Error findOrCreateInstallation", error);
      throw error;
    }
  };
}


export default InstallationController;
