import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

const app: Express = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

type Room = string;
interface RoomInfo {
  [room: Room]: string[];
}
const rooms: RoomInfo = {};

let users = 0;

io.on('connection', (socket: Socket) => {
    users ++;
  console.log('user connected');

  socket.on('join', function(room:string) {
    socket.join(room);
    console.log("joined room" + room);
  });
  

  socket.on('create or join', (room: Room) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }

    if (rooms[room].length < 2) {
      rooms[room].push(socket.id);
      socket.join(room);
      const currentPlayer = "X"
      socket.emit("create or join",room,currentPlayer);
      console.log("emitted 1");

      if (rooms[room].length === 2) {
        const currentPlayer = "O"
        io.to(room).emit('start game', rooms[room]);
        socket.emit("create or join",room,currentPlayer);
        console.log("emitted 2");
      }
    } else {
      socket.emit('room full');
      console.log("room full");
    }
  });
  interface Move {
    x : number,
    y : number
  }
  socket.on('move', (room:string,move : Move) => {
    console.log("got a move");
    io.to(room).emit('move', move);
  });

  socket.on('disconnect', () => {
    users --;
    for (const room in rooms) {
      if (rooms[room].includes(socket.id)) {
        rooms[room] = rooms[room].filter((id) => id !== socket.id);
        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }
    }
    console.log('user disconnected:', socket.id);
  });

  console.log("Users connected : " + users);
});

const port = 8080;
httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});