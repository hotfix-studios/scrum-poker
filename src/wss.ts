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

const broadcastToRoom = (roomId, message) => {
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    room.users.forEach(user => {
      user.ws.send(JSON.stringify(message));
    });
  }
};


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
    const { roomId, isHost, id, fullName, avatar } = params;
    const message = {
      isHost,
      id,
      fullName,
      avatar
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: [{ ...message, ws }] });
      console.log(`Host created room ${roomId}: `, rooms.get(roomId));
    } else {
      console.error(`**ERROR** create: room with id ${roomId} already exists`);
    }
  };

  const join = params => {
    const { roomId, isHost, id, fullName, avatar } = params;
    const message = {
      type: 'join',
      params: {
        isHost,
        id,
        fullName,
        avatar
      }
  }

  if (rooms.has(roomId)) {
    rooms.get(roomId).users.push({ ...message.params, ws });
    console.log(`User joined room ${roomId}: `, rooms.get(roomId));
    broadcastToRoom(roomId, message);
    } else {
      console.error(`**ERROR** join: room with id ${roomId} does not exist`);
    }
  };

  const leave = params => {
    const { roomId, isHost, id, fullName, avatar } = params;
    const message = {
      type: 'leave',
      params: {
        isHost,
        id,
        fullName,
        avatar
      }
    }
    // TODO: Broadcast leave event to other participants
    // TODO: Close room if host leaves
    if (rooms.has(roomId)) {
      const roomObj = rooms.get(roomId);
      if (isHost === true) {
        roomObj.users = roomObj.users.filter(user => user.id !== id);

        console.log(`Host left room ${roomId}: `, rooms.get(roomId));
        broadcastToRoom(roomId, message);
      }
      roomObj.users = roomObj.users.filter(user => user.id !== id);

      console.log(`User left room ${roomId}: `, rooms.get(roomId));
      broadcastToRoom(roomId, message);
    } else {
      console.error(`**ERROR** leave: room with id ${roomId} does not exist`);
    }
  };

  ws.on('close', function close() {
    console.log('User disconnected from WSS');
  });
});

server.listen(port, () => {
  console.log(`Server is listening for websocket events at: ${port}`);
  console.log('Press ctrl + c to quit')
});