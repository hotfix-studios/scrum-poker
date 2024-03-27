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
        const obj = {
            type: 'init',
            params: {
                installationId
            }
        }
        console.log(obj);
        ws.send(JSON.stringify(obj));
  };

  const create = async params => {
    if (!rooms.has(params.roomId)) {
        rooms.set(params.roomId, { users: [params.installationId] });
      console.log(`User created room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`create: room with id ${params.roomId} already exists`);
    }
  };

  const join = async params => {
      if (rooms.has(params.roomId)) {
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