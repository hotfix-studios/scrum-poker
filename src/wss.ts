import { randomUUID } from "crypto";
import dotenv from "dotenv";
import http from "http";
import WebSocket, { WebSocketServer } from 'ws';

dotenv.config();

const port = process.env.WSS_PORT;
const server = http.createServer();

const rooms = {};

const userId = "Dummy Testy";

// Creating a websocket to run on our server
const wss = new WebSocketServer({ server }, () => {
  console.log('WSS started');
});

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
    rooms[params.roomId] = {
      users: [params.userId]
    };
  };
  const join = params => {
    if (rooms[params.roomId]) {
      rooms[params.roomId].users.push(params.userId);
      console.log(`User joined room ${params.roomId}: `, rooms[params.roomId])
    } else {
      console.error(`join: room with id ${params.roomId} does not exist`);
    }
  };
  const leave = params => {};
});

server.listen(port, () => {
  console.log(`Server is listening for websocket events at: ${port}`);
  console.log('Press ctrl + c to quit')
});