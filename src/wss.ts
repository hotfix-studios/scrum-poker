import express from "express";
import dotenv from "dotenv";
import { WebSocketServer } from 'ws';
import http from 'http'

dotenv.config();

const port = process.env.WSS_PORT;
const server = http.createServer(express());

const rooms = new Map()

/*
rooms: {
  roomId: {
    users: [user1, user2, user3]
  }
}
*/

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
        init(params);
        break;
      case "create":
        create(params);
        break;
      case "join":
        join(params);
        break;
      case "leave":
        leave(params);
        break;
      default:
          console.warn(`Type: ${type} unknown`);
        break;
    }
  });

    const init = params => {
        console.log("INIT: Websocket Connection Open (SERVER)");

        const obj = {
            type: 'init',
        }

        ws.send(JSON.stringify(obj));
  };

  const create = params => {
    if (!rooms.has(params.roomId)) {
      rooms.set(params.roomId, { users: [params.installationId] });
      console.log(`Host created room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`**ERROR** create: room with id ${params.roomId} already exists`);
    }
  };

  const join = params => {
    // TODO: Replace test data
    const obj = {
      type: 'join',
      params: {
        userName: "arealplant",
        avatar: "https://ibb.co/n3jTQLB",
        roomId: params.roomId,
      }
  }

  if (rooms.has(params.roomId)) {
    rooms.get(params.roomId).users.push(params.installationId);
    console.log(`User joined room ${params.roomId}: `, rooms.get(params.roomId));
    ws.send(JSON.stringify(obj));
    } else {
      console.error(`**ERROR** join: room with id ${params.roomId} does not exist`);
    }
  };

  const leave = params => {
    if (rooms.has(params.roomId)) {
      const roomObj = rooms.get(params.roomId);
      roomObj.users = roomObj.users.filter(user => user !== params.installationId);

      console.log(`User left room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`**ERROR** leave: room with id ${params.roomId} does not exist`);
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