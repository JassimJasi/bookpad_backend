const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const fileUpload = require("express-fileupload");

const { readdirSync } = require("fs");
const app = express();
const options = {
  origin: "http://localhost:3000",
  useSuccessStatus: 200,
};
app.use(express.json());
app.use(cors({ options }));
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//<<<<<<<<<<<<<ROUTES>>>>>>>>>>>>>>>>>>>>>>>>>>>
// const useRouters = require("./routes/user");
// app.use("/", useRouters);
//<<<<<<<<<<<<<daynamic way to route page>>>>>>>>>>>>>
readdirSync("./routes").map((rou) => {
  app.use("/", require("./routes/" + rou));
});

//<<<<<<<<<<<<<DATABASE>>>>>>>>>>>>>>>>>>>>>>>>>>>
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Error connection to database ", err));

//<<<<<<<<<<<<<socket io>>>>>>>>>>>>>>>>>>>>>>>>>>>
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  // if its the same user we are not going to add
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //when connect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    io.to(user?.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

//<<<<<<<<<<<<<socket io>>>>>>>>>>>>>>>>>>>>>>>>>>>

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
