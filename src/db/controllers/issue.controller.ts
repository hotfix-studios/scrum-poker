import { Backlog, Pointed } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";

import { Model, Document } from "mongoose";
import * as OctokitTypes from "../../types/octokit.js";


/**
 * This will be the Repository for User Model (CRUD)
 */
export class IssueController extends ARepository {

  constructor(model: Model<any>) {
    super(model);
  }

  createBacklogForRepoIfNotExists = async (issues: OctokitTypes.Issue[]): Promise<boolean> => {
    const backlogRepoUrl = issues[0].repository_url;

    const foundBacklogDoc = await Backlog.exists({ repository_url: backlogRepoUrl });
    const foundPointedDoc = await Pointed.exists({ repository_url: backlogRepoUrl });

    const pointedIssuesNumbers: number[] = await Pointed.find({ repository_url: backlogRepoUrl }, "number");

    if (foundBacklogDoc == null) {
      const processedIssues = issues.map(async (issue: OctokitTypes.Issue) => {
        if (!pointedIssuesNumbers.includes(issue.number)) {
          return {
            _id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            url: issue.url,
            repository_url: issue.repository_url,
            owner_name: issue.user.login,
            owner_avatar: issue.user.avatar_url,
            pointed: false
          };
        }
      });

      try {

        await Backlog.create(processedIssues);

      } catch (error) {

        console.error("Failure writing PROCESSED {issues} to BACKLOG model create...", error);

      }
    } else {

      return false;
    }

    return true;
  };

  // TODO: issueOpenedHandler will call this method to write single issue document to Backlog
  // define createNewBacklogIssue()

};
