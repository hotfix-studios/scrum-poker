import express from "express";
import dotenv from "dotenv";
import { WebSocketServer } from 'ws';
import http from 'http'

/* temporary Controllers */
import { octokitApi } from "./api/index.js";
import { installationController, userController, repositoryController } from "./db/controllers/index.js";

import * as OctokitTypes from "../src/types/octokit.js";
import { Installation } from "../src/db/models/index.js";

dotenv.config();

const port = process.env.WSS_PORT;
const server = http.createServer(express());

// const rooms = {};
const rooms = new Map()

/* How to delete rooms
rooms: {
  roomId: {
    users: [user1, user2, user3]
  }
}
*/
let installationId;

// Creating a websocket to run on our server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {

  ws.on('error', console.error);

  ws.on('message', async data => {
    const rawData = data.toString();
    const obj = JSON.parse(rawData);
    const type = obj.type;
    const params = obj.params;

    switch (type) {
      case "init":
        await init(params);
        break;
      case "create":
        await create(params);
        console.log("rooms obj", rooms);
        break;
      case "join":
        await join(params); // might need async/await?
        break;
      case "leave":
        await leave(params); // might need async/await?
        break;
      default:
          console.warn(`Type: ${type} unknown`);
        break;
    }
  });

    const init = async params => {
        installationId = await params.installationId;
        console.log("INSTALL ID: from INIT PARAMS", params.installationId);

        /* TypeScript fucking me in the ass */
        let installation = await installationController.findInstallationById(params.installationId);

        /* TODO: this should probably be a join table query to get repos for each id on DB processor */
        const installationReposIds: number[] = installation.repos;
        // look up repo by id
        // // get repo.owner_id (query) && repo.name (done)
        // // // look up user by repo.owner_id
        // // // // get user.name

        /* TODO: by default "data" returned by controller fn looks like this: { _id: 630630961, name: 'arteiras' } might not need ids Array */
        const installationRepoNamesPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
          const data = await repositoryController.findRepoNameById(repoId);
          // @ts-ignore
          return data.name;
        });

        const installationReposIssuesUrlsPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
          const data = await repositoryController.getRepoIssuesUrl(repoId);
          // @ts-ignore
          return data.issues_url;
        });

        const installationReposDataPromises: Promise<any>[] = installationReposIds.map(async (repoId: number) => {
          // @ts-ignore
          return repositoryController.getRepoProjectionById(repoId, [ "name", "issues_url" ]);
          /* above will return { _id: 000000000, name: 'repo-name', issues_url: 'https://...' } */
        });

        const installationRepoNames = await Promise.all(installationRepoNamesPromises);
        const installationReposIssuesUrls = await Promise.all(installationReposIssuesUrlsPromises);

        const installationReposData = await Promise.all(installationReposDataPromises);

        const obj = {
            type: 'init',
            params: {
                installationId: params.installationId,
                installationReposIds,
                installationRepoNames,
                installationReposIssuesUrls,
                installationReposData
            }
        }

        console.log("installationReposIds, installationRepoNames, installationReposIssuesUrls");
        console.log(obj);

        ws.send(JSON.stringify(obj));

  };

  /* TODO: users getting pushed installation id needs to be user id? */
  const create = async params => {
    if (!rooms.has(params.roomId)) {
        rooms.set(params.roomId, { users: [params.installationId] });

        console.log("WSS INSIDE CREATE PARAMS: repoName, repoId, repoOwnerId", params);

        // single repo name on param, query for repo issues url
        const repoName = params.selectedRepoName;
        const repoId = params.SelectedRepoId;
        let repoOwnerId;
        try {
            repoOwnerId = repositoryController.socketFindOneById(repoId)["owner_id"];
        } catch (e) {
            console.error("FAILED getting owner_id with brackets by repoId", e);
        }

        //const installationQueryParams: any = installationReposIds.map(async (e: any) => {
        //    const repoObj: any = await repositoryController.socketFindOneById(e);
        //    return { owner_id: repoObj.owner_id, name: repoObj.name };
        //});

        //const { data } = await octokit.rest.issues.listForRepo(params);

        //const params = { owner: repository.owner.login, repo: repository.name };

        const backlog = octokitApi.getIssues({ owner: repoOwnerId, repo: repoName });

        // use name to query for issues URL (on repo)
        // send back backlog
        // params.selectedRepo
        const obj = {
            type: 'create',
            params: {
                installationId: params.installationId,
                backlog
            }
        }
        ws.send(JSON.stringify(obj));

      console.log(`User created room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`create: room with id ${params.roomId} already exists`);
    }
  };

  const join = async params => {
      if (rooms.has(params.roomId)) {

          // pass some kind of identifying name for github user and pass on obj
          // ws.send(JSON.stringify(obj));

      rooms.get(params.roomId).users.push(params.installationId);
      console.log(`User joined room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`join: room with id ${params.roomId} does not exist`);
    }
  };

  const leave = async params => {
    if (rooms.has(params.roomId)) {
      const roomObj = rooms.get(params.roomId);
      const updatedRoomObj = {
        ...roomObj,
         users: roomObj.users.filter(user => user !== params.installationId)
        };
      rooms.set(params.roomId, updatedRoomObj);
      console.log(`User left room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`leave: room with id ${params.roomId} does not exist`);
    }
  };

  ws.on('close', function close() {
    console.log('disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is listening for websocket events at: ${port}`);
  console.log('Press ctrl + c to quit')
});