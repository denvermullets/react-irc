import express from "express";
import { Server } from "socket.io";
import * as http from "http";
import db from "./database/db";

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://127.0.0.1:5173",
    // depends on what your host url is
    origin: "http://localhost:5173",
    // origin:
    //   "http://react-irc-bucket-3f6bc42.s3-website-us-east-1.amazonaws.com",
  },
});

console.log("db", process.env.DATABASE_URL || "not_here");
// storing a list of users w/their channel to keep track of disconnects and number of users in a room
// TODO: close out a room when no users are present as rooms will persist until told to close
const users: { [socketId: string]: { username: string; channel: string } } = {};
const waitingRoom: {
  [socketId: string]: { username: string; channel: string };
} = {};

const createUserRecord = async (name: string, assignment_id: string) => {
  try {
    const newRecord = await db("users")
      .insert({
        name,
        assignment_id,
        created_at: new Date().toISOString(),
      })
      .returning("*")
      .catch((err: Error) => {
        throw err;
      });

    console.log(newRecord);
    const jsonRecord = newRecord.map((record) => record.toJSON());
    console.log(jsonRecord);
  } catch (err) {
    console.log(err);
  }
};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join", (channel: string, username: string) => {
    console.log("waitingRoom: ", waitingRoom);
    // createUserRecord(username, channel);

    // we're going to start with just grouping 2 people together in a room
    // assigning roles or figuring out who is what role can come later
    const usersWaiting = Object.keys(waitingRoom).length;
    console.log("usersWaiting: ", usersWaiting);

    if (usersWaiting > 100) {
      // Get the first waiting user and move object to user list
      const waitingSocketId = Object.keys(waitingRoom)[0];
      const waitingUser = waitingRoom[waitingSocketId];
      console.log("waitingUser: ", waitingUser);

      users[waitingSocketId] = waitingUser;
      delete waitingRoom[waitingSocketId];
      console.log("waiting room old user", waitingRoom[waitingSocketId]);
      delete waitingRoom[socket.id];
      console.log("waiting room new", waitingRoom[socket.id]);

      // move previous waiting user to new room
      const waitingUserSocket = io.sockets.sockets.get(waitingSocketId);
      io.to(waitingUser.channel).emit("message", {
        content: `The event is about to start!`,
        username: "System",
        type: "message",
      });
      waitingUserSocket?.leave(waitingUser.channel);
      waitingUserSocket?.join("new-room");
      waitingUserSocket?.emit("changeChannel", "new-room");

      users[waitingSocketId] = {
        username: waitingUser.username,
        channel: "new-room",
      };
      users[socket.id] = { username, channel: "new-room" };

      socket.join("new-room");
      io.to("new-room").emit("message", {
        content: `${username} joined channel new-room`,
        username,
        type: "connection",
      });
      io.to("new-room").emit("changeChannel", "new-room");
    } else {
      // TODO: check if user is in list already otherwise they get readded to waitlist
      waitingRoom[socket.id] = { username, channel };
      socket.join(channel);
      io.to(channel).emit("message", {
        content: `${username} joined channel ${channel}`,
        username,
        type: "connection",
      });
    }
  });

  socket.on("message", (channel: string, message: string, username: string) => {
    if (message.startsWith("/bid")) {
      const bidAmount = message.split("/bid")[1].trim();
      io.to(channel).emit("message", {
        content: `${username} proposed: $${bidAmount}`,
        username,
        type: "bid",
      });
    } else if (message.startsWith("/reject")) {
      io.to(channel).emit("message", {
        content: `${username} rejected your bid.`,
        username,
        type: "reject",
      });
    } else {
      console.log("channel", channel, message, username);
      console.log("users", users);
      console.log("waiting", waitingRoom);
      io.to(channel).emit("message", {
        content: `${username}: ${message}`,
        username,
        type: "message",
      });
    }
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const { username, channel } = user;
      io.to(channel).emit("message", {
        content: `${username} disconnected`,
        username,
        type: "connection",
      });
      delete users[socket.id];
    }
  });
});

server.listen(PORT, () => console.log("NODE IS RUN"));
