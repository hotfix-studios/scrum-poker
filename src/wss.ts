import express from "express";
import dotenv from "dotenv";
import { WebSocketServer } from 'ws';
import http from 'http'

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
const userId = "Dummy Testy";

// Creating a websocket to run on our server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {

  ws.on('error', console.error);

  ws.on('message', data => {
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
        console.log("rooms obj", rooms);
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
    const obj = {
      type: 'init',
      params: {
        userId
      }
    }
    ws.send(JSON.stringify(obj));
  };

  const create = params => {
    if (!rooms.has(params.roomId)) {
      rooms.set(params.roomId, {users: [params.userId]});
    }
  };

  const join = params => {
    if (rooms.has(params.roomId)) {
      rooms.get(params.roomId).users.push(params.userId);
      console.log(`User joined room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`join: room with id ${params.roomId} does not exist`);
    }
  };

  const leave = params => {
    if (rooms.has(params.roomId)) {
      const roomObj = rooms.get(params.roomId);
      const updatedRoomObj = {
        ...roomObj,
         users: roomObj.users.filter(user => user !== params.userId)
        };
      rooms.set(params.roomId, updatedRoomObj);
      console.log(`User left room ${params.roomId}: `, rooms.get(params.roomId));
    } else {
      console.error(`leave: room with id ${params.roomId} does not exist`);
    }
  };

  // ws.on('close', )
});

server.listen(port, () => {
  console.log(`Server is listening for websocket events at: ${port}`);
  console.log('Press ctrl + c to quit')
});