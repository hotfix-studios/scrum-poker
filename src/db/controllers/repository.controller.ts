import { Repository } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";

import { Model, Document } from "mongoose";
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
export class RepositoryController extends ARepository {

  constructor(model: Model<any>) {
    super(model);
  }

  public _testObj: DTO.Repository;

  ///////////////////////////
  // #region REST/CRUD //////
  ///////////////////////////

  findRepoId = async (ownerId: number): Promise<number> => {
    return await this._model.findOne({ owner_id: ownerId }, "_id");
  };

  findRepoNameByOwnerId = async (ownerId: number): Promise<string> => {
    return await this._model.findOne({ owner_id: ownerId }, "name");
  };

  // TODO: needs a simple GET to get repo document (problem with types...)

  findRepoIssuesUrl = async (id: number): Promise<string> => {
    return await this._model.findById(id, "issues_url");
  };

  findRepoNameById = async (repoId: number): Promise<Partial<typeof Repository>> => {
    const data = await this._model.findOne({ _id: repoId }, "name");
    console.log("INSIDE CONTROLLER calling model for repo name:", data);
    return data;
  };

  createRepo = async (repo: Partial<OctokitTypes.Repository>): Promise<boolean> => {
    const writeRepo = { _id: repo.id, owner_id: repo.owner.id, ...repo };
    return await this._model.create(writeRepo) ? true : false;
  };

  /**
   * @deprecated
   */
  // createInstallationRepositories = async (repos): Promise<Document<any, any, any>[] | boolean> => {
  //   const _repositories = repos.map((repo: OctokitTypes.Repository) => {
  //     console.log("inside map:", repo);

  //     return {
  //       _id: repo.id,
  //       name: repo.name,
  //       full_name: repo.full_name,
  //       private: repo.private,
  //       owner_id: repo.owner.id,
  //       description: repo.description,
  //       url: repo.url,
  //       collaborators_url: repo.collaborators_url,
  //       teams_url: repo.teams_url,
  //       hooks_url: repo.hooks_url,
  //       issue_events_url: repo.issue_events_url,
  //       events_url: repo.events_url,
  //       assignees_url: repo.assignees_url,
  //       languages_url: repo.languages_url,
  //       contributors_url: repo.contributors_url,
  //       comments_url: repo.comments_url,
  //       issue_comment_url: repo.issue_comment_url,
  //       contents_url: repo.contents_url,
  //       issues_url: repo.issues_url,
  //       labels_url: repo.labels_url,
  //       clone_url: repo.clone_url,
  //       has_issues: repo.has_issues,
  //       has_projects: repo.has_projects,
  //       open_issues_count: repo.open_issues_count
  //     }
  //   });

    // try {

    //   const documents = await this._model.create(_repositories);
    //   console.log("repos inserted from payload:", documents);

    //   if (documents) return documents;

    // } catch (error) {

    //   console.error("Error inserting repos from payload:", error);
    //   return false;
    // }
  // };

  createRepos = async (repos: DTO.Repository[]): Promise<DocumentTypes.Repository[]> => {
    try {

      const repoDocs = await this._model.create(repos);
      console.log("repos inserted from payload:", repoDocs);

      if (repoDocs) return repoDocs;

    } catch (error) {

      console.error("Error inserting repos from payload:", error);
      throw error;
    }
  };

  mapRepoDocument = <T extends OctokitTypes.Repository | DocumentTypes.Repository>(restRepo: T): DocumentTypes.Repository => {
    const id = "id" in restRepo ? restRepo.id : restRepo._id;
    const is_private = "private" in restRepo ? restRepo.private : restRepo.is_private;
    const owner_id = "owner" in restRepo ? restRepo.owner.id : restRepo.owner_id;
    const [ has_backlog, has_pointed ] = [ false, false ];
    return {
      _id: id,
      name: restRepo.name,
      full_name: restRepo.full_name,
      is_private: is_private,
      owner_id: owner_id,
      description: restRepo.description,
      url: restRepo.url,
      collaborators_url: restRepo.collaborators_url,
      teams_url: restRepo.teams_url,
      assignees_url: restRepo.assignees_url,
      contributors_url: restRepo.contributors_url,
      comments_url: restRepo.comments_url,
      issue_comment_url: restRepo.issue_comment_url,
      issues_url: restRepo.issues_url,
      labels_url: restRepo.labels_url,
      clone_url: restRepo.clone_url,
      language: restRepo.language,
      has_issues: restRepo.has_issues,
      has_projects: restRepo.has_projects,
      open_issues_count: restRepo.open_issues_count,
      has_backlog: has_backlog,
      has_pointed: has_pointed
     } as DocumentTypes.Repository;
  };

  mapRepoDTOArray = <T extends OctokitTypes.Repository | DocumentTypes.Repository>(restRepos: T[]): DocumentTypes.Repository[] => {
    return restRepos.map(this.mapRepoDocument);
  };

  ///////////////////////////
  // #endregion REST/CRUD ///
  ///////////////////////////

  ///////////////////////////
  // #region HTTP ///////////
  ///////////////////////////


  ///////////////////////////
  // #endregion HTTP ////////
  ///////////////////////////
}

export default RepositoryController;