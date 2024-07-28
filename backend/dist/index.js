"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const rooms = {};
let users = 0;
io.on('connection', (socket) => {
    users++;
    console.log('user connected');
    socket.on('join', function (room) {
        socket.join(room);
        console.log("joined room" + room);
    });
    socket.on('create or join', (room) => {
        if (!rooms[room]) {
            rooms[room] = [];
        }
        if (rooms[room].length < 2) {
            rooms[room].push(socket.id);
            socket.join(room);
            const currentPlayer = "X";
            socket.emit("create or join", room, currentPlayer);
            console.log("emitted 1");
            if (rooms[room].length === 2) {
                const currentPlayer = "O";
                io.to(room).emit('start game', rooms[room]);
                socket.emit("create or join", room, currentPlayer);
                console.log("emitted 2");
            }
        }
        else {
            socket.emit('room full');
            console.log("room full");
        }
    });
    socket.on('move', (room, move) => {
        console.log("got a move");
        io.to(room).emit('move', move);
    });
    socket.on('disconnect', () => {
        users--;
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
