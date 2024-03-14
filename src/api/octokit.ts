/* TYPES */
// import { Issue } from "../types/octokit.js";
import * as OctokitTypes from '../types/octokit.js';

/**
 * Octokit Responsibilities:
 * - Get GH User info
 * - Get Repos
 * - - Get Backlogs
 * - - Get associated users (repo)
 * - Get Organization
 * - - Get associated users (org)
 * - Put Issues (move lanes)
 * - Post/Put story points to issues (look for field with type number (on Project/Issues))
 * - Post Sprint (completed)(pending completion?)
 */

const issueOpenedHandler = ({ octokit, payload }) => {
  console.log("ISSUE OPENED:", payload);

  const { repository, issue }: { repository: OctokitTypes.Repository, issue: OctokitTypes.Issue } = payload;
  const owner = repository.owner.login;
  const repo = repository.name;
  const issueNumber = issue.number;

  return octokit.rest.issues.createComment({
    owner: owner,
    repo: repo,
    issue_number: issueNumber,
    body: "Hello, World!",
  });
};

const pullRequestOpenedHandler = async ({octokit, payload}) => {
  console.log(`Received a pull request event for #${payload.pull_request.number}`);
  // TODO: LOG PAYLOAD HERE
  try {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: "Thanks for opening a new PR!",
      headers: {
        "x-github-api-version": "2022-11-28",
        // "content-type": "application/json", // might not need, possibly default
        "x-accepted-github-permissions": true // this header as well to get a response of all required permissions for the GH API request!
      },
    });
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    }
    console.error(error)
  }
};

const wildCardErrorHandler = (error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
};

export const octokitApi = {
  issueOpenedHandler,
  pullRequestOpenedHandler,
  wildCardErrorHandler
};