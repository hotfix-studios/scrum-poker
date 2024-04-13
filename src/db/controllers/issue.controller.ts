import { Backlog, Pointed } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";

import { Model, Document } from "mongoose";
import { OctokitTypes, DTO } from "../../types/index.js";

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
export class IssuesController {

  private _backlog: typeof Backlog;
  private _pointed: typeof Pointed;

  constructor(backlogModel: Model<any>, pointedModel: Model<any>) {
    this._backlog = backlogModel;
    this._pointed = pointedModel;
  }

  /**
   * @summary Finds backlog if exists (determine if exists by calling create... first?)
   */
  findBacklog = async (repoName: string): Promise<any | null> => {
    try {

      return await this._backlog.find({ repository_name: repoName });
    } catch (error) {

      console.error(`Backlog does not exist in DB for ${repoName} returning to execution scope with null...`);
      return null;
    }
  };

  /**
   * @todo issues: param type may be off..
   * @requires repoName to write to DB (get before with RepositoryController) (not located on Issue Rest Obj)
   */
  createBacklogForRepoIfNotExists = async (issues: Partial<OctokitTypes.Issue>[], repoName: string): Promise<any | null> => {
    console.log("-----------------------TOMATO-------------");
    // console.log(issues);

    const foundBacklogDoc = await this._backlog.exists({ repository_name: repoName });
    const foundPointedDoc = await this._pointed.exists({ repository_name: repoName });
    console.log(`FOUND BACKLOG DOC? ${foundBacklogDoc}`);
    console.log(`FOUND POINTED DOC? ${foundPointedDoc}`);

    let pointedIssuesNumbers: DTO.IdAndNum[];

    if (foundPointedDoc) pointedIssuesNumbers = await this._pointed.find({ repository_name: repoName }, "number");

    if (foundBacklogDoc === null) {
      const processedIssues = issues.map((issue: Partial<OctokitTypes.Issue>) => {
        // else case: issue has "closed" state
        if (issue.state === "open") {
          // else case: issue.number exists in Pointed
          if (!foundPointedDoc || foundPointedDoc && !this.hasNumber(pointedIssuesNumbers, issue.number)) {
            const labels = issue.labels.length ? issue.labels.map((label: any) => label.name) : [];
            return {
              _id: issue.id,
              url: issue.url,
              repository_name: repoName,
              repository_url: issue.repository_url,
              number: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              labels: labels,
              pointed: false
            };
          }
        }
      });

      /* Resolving issues promises */
      // const issuesToWrite = Promise.all(processedIssues);

      try {
        // console.log(processedIssues);
        return await Backlog.create(processedIssues);

      } catch (error) {

        console.error("Failure writing PROCESSED {issues} to BACKLOG model create...", error);
        throw error;
      }
    } else {

      console.log(`Backlog for ${repoName} already exists... exiting write op`);
      return null;
    }
  };

  // TODO: issueOpenedHandler will call this method to write single issue document to Backlog
  // define createNewBacklogIssue()

  ///////////////////////////
  //////// Helpers //////////
  ///////////////////////////

  hasNumber = (issuesArr: Partial<OctokitTypes.Issue>[], issueNumber: number): boolean => {
    return issuesArr.some((obj: Partial<OctokitTypes.Issue>) => obj.number === issueNumber);
  };

};


/**
 * @deprecated This logic was all living on the api middlewares level.
 * @description "mappedIssues" was like an intermediary stage/DTO containing extra data, if needed access here (api level?):
 */
  // const mappedIssues = restIssues.map((issue: any) => {
  //   if (issue.state === "open") {
  //     return {
  //       _id: issue.id,
  //       url: issue.url,
  //       repository_name: params.repo, // this can be used to look up issues by (this is repo.name from Mongo)
  //       repository_url: issue.repository_url, // this can be used to look up issues by (this is repo.url from Mongo)
  //       number: issue.number,
  //       title: issue.title,
  //       labels: issue.labels,
  //       state: issue.state,
  //       assignee: issue.assignee,
  //       assignees: issue.assignees,
  //       created_at: issue.created_at,
  //       updated_at: issue.updated_at,
  //       closed_at: issue.closed_at,
  //       author_association: issue.author_association,
  //       body: issue.body,
  //     };
  //   }
  // });

  // /**
  //  * @satisfies every label includes (\D\)("not digit") should be written to Backlog
  //  */
  // const backlogIssues = restIssues.filter((issue: any) => {
  //   /* labels do not include any "digits" */
  //   return issue.labels.every((label: any) => /\D/.test(label))
  // });

  // /**
  //  * @satisfies labels include at least one (\d\)("digit") should be written to Pointed
  //  */
  // const pointedIssues = restIssues.filter((issue: any) => {
  //   /* labels include a "digit" */
  //   return issue.labels.some((label: any) => /\d/.test(label));
  // });

export default IssuesController;
