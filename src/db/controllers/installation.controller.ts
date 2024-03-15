import { Installation, Repository } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";
import { Request, Response } from "express";
import { Schema, Model, FilterQuery, Document } from "mongoose";
import * as OctokitTypes from '../../types/octokit.js';


// export class InstallationController extends ARepository {
  //   constructor() {
    //     super(Installation);
    //   }
    // };

/**
 * This will be the Repository for User Model (CRUD)
 */
class InstallationController {

  public readonly _model: Model<any>;

  constructor(model: Model<any>) {
    this._model = model;
  }

  /**
   * @summary should only ever be one installation per client?
   * @returns installation id
   */
  getInstallationId = async (octokit, payload) => {
    return await this._model.find({}, "_id");
  };

  // TODO: need to validate which APP is being installed? process.env.APP_ID;
  findOrCreateInstallation = async (payload) => {
    try {

      let _installation = await this.findInstallationById(payload.installation.id);
      let _repositories: any[];

      if (_installation === null) {

        const { installation, repositories }: { installation: OctokitTypes.Installation, repositories: OctokitTypes.Repository[] } = payload;
        const { id, target_id, target_type, account } = installation;
        const { login, organizations_url, repos_url } = account;

        if (repositories.length) {

          _repositories = repositories.map(repo => {
            console.log("inside map:", repo);
            return {
              _id: repo.id,
              name: repo.name,
              full_name: repo.full_name,
              private: repo.private
            }
          });

          try {
            const repos = await Repository.create(_repositories);
            console.log("repos inserted from payload:", repos);
          } catch (error) {
            console.error("Error inserting repos from payload:", error);
          }
        }

        const insertInstallation = {
          _id: id,
          owner_name: login,
          owner_id: target_id,
          type: target_type,
          orgs_url: organizations_url,
          repos_url: repos_url,
          repos: _repositories
        }

        try {
          _installation = await Installation.create(insertInstallation);
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

  findInstallationById = async (id: number) => {
    return await Installation.findById(id);
  };
}


// const findOrCreateInstallation = async (octokit, payload) => {
//   try {

//     let _installation = await findInstallationById(payload.installation.id);

//     if (_installation === null) {

//       const { installation, repositories }: { installation: OctokitTypes.Installation, repositories: OctokitTypes.Repository[] } = payload;
//       const { id, target_id, target_type, account } = installation;
//       const { login, organizations_url, repos_url } = account;

//       const insertInstallation = {
//         _id: id,
//         owner_name: login,
//         owner_id: target_id,
//         type: target_type,
//         orgs_url: organizations_url,
//         repos_url: repos_url,
//         repos: repositories
//       }

//       try {
//         _installation = await Installation.create(insertInstallation);
//       } catch (error) {
//         console.error("BONK:", error);
//       }

//       console.log("Installation created and saved!");
//       return _installation;

//     } else {

//       console.log("Installation found.");
//       return _installation;
//     }

//   } catch (error) {

//     console.error("Internal Server Error findOrCreateInstallation", error);
//     throw error;
//   }
// };

/* THIS IS CLOSE TO TYPED CORRECTLY BUT FUCKING TS... */
// const findOrCreateInstallation = async (octokit, payload): Promise<typeof Installation> => {

//   try {
//     let _installation: typeof Installation | null = await findInstallationById(payload.installation.id);

//     if (_installation === null) {
//       const { installation, repositories }: { installation: OctokitTypes.Installation, repositories: OctokitTypes.Repository[] } = payload;
//       const { id, target_id, target_type, account } = installation;
//       const { login, organizations_url, repos_url } = account;

//       const insertInstallation: Partial<typeof Installation> = {
//         _id: id,
//         owner_name: login,
//         owner_id: target_id,
//         type: target_type,
//         orgs_url: organizations_url,
//         repos_url: repos_url,
//         repos: repositories
//       }

//       _installation = await Installation.create(insertInstallation);
//       // _installation = insertInstallation;
//       // _installation.save();
//       return _installation;
//     } else {
//       return _installation;
//     }

//   } catch (error) {
//     console.error("Internal Server Error findOrCreateInstallation", error);
//     throw error;
//   }
// };

// const findInstallationById = async (id: number) => {
//   return await Installation.findById(id);
// };

export default new InstallationController(Installation);