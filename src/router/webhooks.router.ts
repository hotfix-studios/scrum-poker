import { app } from "../app.js";
// import { Issue } from "../types/octokit.js";
import * as OctokitTypes from '../types/octokit.js';

/**
 * This adds an event handler that your code will call later.
 * When this event handler is called, it will log the event to the console.
 * Then, it will use GitHub's REST API to add a comment to the pull request that triggered the event.
 */
const handlePullRequestOpened = async ({octokit, payload}) => {
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

/**
 * This sets up a webhook event listener. When your app receives a webhook event from GitHub with a `X-GitHub-Event`
 * header value of `pull_request` and an `action` payload value of `opened`, it calls the `handlePullRequestOpened`
 * event handler that is defined above.
 */
app.webhooks.on("pull_request.opened", handlePullRequestOpened);

// TODO: check out if this is good:
// app.webhooks.verify

app.webhooks.on("issues.opened", ({ octokit, payload }) => {
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
});

// This logs any errors that occur.
app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});
