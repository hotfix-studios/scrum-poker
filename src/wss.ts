import http from "http";
import WebSocket, { WebSocketServer } from 'ws';

const port = 3001;
const server = http.createServer();

// Creating a websocket to run on our server
const wss = new WebSocketServer({ server }, () => {
  console.log('WSS started');
});

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data) => {
    console.log('data received from client: ', data);
    ws.send('Message received!');
  });

});

server.listen(port, () => {
  console.log(`Server is listening for websocket events at: ${port}`);
  console.log('Press ctrl + c to quit')
});