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

interface Move {
  x : number,
  y : number
}

const rooms: RoomInfo = {};
let users = 0;

io.on('connection', (socket: Socket) => {
  users++;
  console.log('User connected:', socket.id);

  socket.on('join', (room: string) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('create or join', (room: Room) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }

    if (rooms[room].length < 2) {
      rooms[room].push(socket.id);
      socket.join(room);
      const currentPlayer = rooms[room].length === 1 ? 'X' : 'O';
      socket.emit('create or join', room, currentPlayer);
      console.log(`User ${socket.id} joined room ${room} as ${currentPlayer}`);

      if (rooms[room].length === 2) {
        io.to(room).emit('start game', rooms[room]);
        console.log(`Game started in room ${room}`);
      }
    } else {
      socket.emit('room full');
      console.log(`Room ${room} is full`);
    }
  });

  socket.on('move', (room: string, move: Move,player : "X" | "O") => {
    console.log(`Move received from ${socket.id} in room ${room}`);
    io.to(room).emit('move', move,player);
  });

  socket.on("win",(player:string,room : string)=>{
    console.log(`Player ${player} wins in room ${room}`);
    io.to(room).emit("win",player);
  })

  socket.on('disconnect', () => {
    users--;
    for (const room in rooms) {
      if (rooms[room].includes(socket.id)) {
        rooms[room] = rooms[room].filter((id) => id !== socket.id);
        if (rooms[room].length === 0) {
          delete rooms[room];
        }
        console.log(`User ${socket.id} left room ${room}`);
      }
    }
    console.log('User disconnected:', socket.id);
    console.log(`Users connected: ${users}`);
  });
});

const port = 8080;
httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
