import { Repository } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";

import { Model, Document } from "mongoose";
import * as OctokitTypes from "../../types/octokit.js";

// TODO: move to types/DTO.d.ts
interface RepositoryDTO {
  id: number;
  name: string;
  full_name: string;
  private?: boolean;
  owner_id?: number;
  description?: string | null;
  url?: string;
  collaborators_url?: string;
  teams_url?: string;
  hooks_url?: string;
  issue_events_url?: string;
  events_url?: string;
  assignees_url?: string;
  languages_url?: string;
  contributors_url?: string;
  comments_url?: string;
  issue_comment_url?: string;
  contents_url?: string;
  issues_url?: string;
  labels_url?: string;
  clone_url?: string;
  has_issues?: boolean;
  has_projects?: boolean;
  open_issues_count?: number;
};

/**
 * This will be the Repository for User Model (CRUD)
 */
export class RepositoryController extends ARepository {

  constructor(model: Model<any>) {
    super(model);
  }

  //# ###############
  //#region REST/CRUD
  //# ###############
  //# USE:
  //# # - Create...
  //# # - Find...
  //# # - Update...
  //# # - Delete...
  //# ###############
  getRepoId = async (ownerId: number): Promise<number> => {
    return await this._model.findOne({ owner_id: ownerId }, "_id");
  };

  // TODO: needs a simple GET to get repo document (problem with types...)

  getRepoIssuesUrl = async (id: number): Promise<string> => {
    return await this._model.findById(id, "issues_url");
  };

  findRepoNameById = async (repoId: number): Promise<Partial<typeof Repository>> => {
    const data = await this._model.findOne({ _id: repoId }, "name");
    console.log("INSIDE CONTROLLER calling model for repo name:", data);
    return data;
  };

  getRepoProjectionById = async (repoId: number, projections: string[]): Promise<Partial<typeof Repository>> => {
    return await this._model.findById(repoId, projections);
  };

  createRepo = async (repo: Partial<OctokitTypes.Repository>): Promise<boolean> => {
    const writeRepo = { _id: repo.id, owner_id: repo.owner.id, ...repo };
    return await this._model.create(writeRepo) ? true : false;
  };

  createInstallationRepositories = async (repos): Promise<Document<any, any, any>[] | boolean> => {
    const _repositories = repos.map((repo: OctokitTypes.Repository) => {
      console.log("inside map:", repo);

      return {
        _id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner_id: repo.owner.id,
        description: repo.description,
        url: repo.url,
        collaborators_url: repo.collaborators_url,
        teams_url: repo.teams_url,
        hooks_url: repo.hooks_url,
        issue_events_url: repo.issue_events_url,
        events_url: repo.events_url,
        assignees_url: repo.assignees_url,
        languages_url: repo.languages_url,
        contributors_url: repo.contributors_url,
        comments_url: repo.comments_url,
        issue_comment_url: repo.issue_comment_url,
        contents_url: repo.contents_url,
        issues_url: repo.issues_url,
        labels_url: repo.labels_url,
        clone_url: repo.clone_url,
        has_issues: repo.has_issues,
        has_projects: repo.has_projects,
        open_issues_count: repo.open_issues_count
      }
    });


    try {

      const documents = await this._model.create(_repositories);
      console.log("repos inserted from payload:", documents);

      if (documents) return documents;

    } catch (error) {

      console.error("Error inserting repos from payload:", error);
      return false;
    }
  };

  //# ##################
  //#endregion REST/CRUD
  //# ##################
  //# ##################

  //# ##################
  //#region HTTP ROUTES
  //# ##################
  //# USE:
  //# # - Post...
  //# # - Get...
  //# # - Put/Patch...
  //# # - Delete...
  //# ###############

  //# ##################
  //#endregion HTTP ROUTES
  //# ##################
  //# ##################
}

export default RepositoryController;