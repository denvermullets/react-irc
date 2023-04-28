import express from "express";
import { Server } from "socket.io";
import * as http from "http";

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://127.0.0.1:5173",
    // depends on what your host url is
    origin: "http://localhost:5173",
  },
});

const users: { [key: string]: { username: string; channel: string } } = {};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join", (channel, username) => {
    console.log(`${username} joined channel: ${channel}`);
    users[socket.id] = { username, channel };
    socket.join(channel);
    io.to(channel).emit("message", `${username} joined channel ${channel}`);
  });

  socket.on("message", (channel: string, message: string, username: string) => {
    console.log(`message received in channel ${channel}: ${message}`);
    io.to(channel).emit("message", `${username}: ${message}`);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const { username, channel } = user;
      console.log(`${username} disconnected`);
      io.to(channel).emit("message", `${username}: disconnected`);
      delete users[socket.id];
    }
  });
});

server.listen(PORT, () => console.log("NODE IS RUN"));
