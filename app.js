const cors = require("cors");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const error = require("./middlewares/error");
const payment = require("./routes/payment");
const orders = require("./routes/orders");
const auth = require("./routes/auth");
const users = require("./routes/users");
const products = require("./routes/products");
const categories = require("./routes/categories");
const home = require("./routes/home");
const config = require("config");
const mongoose = require("mongoose");
const EventEmitter = require("events");
const winston = require("winston");
require("winston-mongodb");
const express = require("express");
const app = express();

// configuration
if (!config.get("jwtPrivateKey")) {
  throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
}
if (!config.get("stripePrivateKey")) {
  throw new Error("FATAL ERROR: stripePrivateKey is not defined.");
}

winston.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);
winston.add(new winston.transports.File({ filename: "logfile.log" }));
winston.add(
  new winston.transports.MongoDB({
    level: "info",
    db: "mongodb://localhost:27017/shirty_errors",
    options: {
      useUnifiedTopology: true,
    },
    format: winston.format.metadata(),
  })
);
winston.exceptions.handle(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.prettyPrint()
    ),
  }),
  new winston.transports.File({ filename: "uncaughtExceptions.log" })
);
process.on("unhandledRejection", (err) => {
  throw err;
});

// connecting to mongodb
mongoose.connect(config.get("db")).then(() => {
  console.log("Connected to MongoDb...");
});

// settting up the application
const eventEmitter = new EventEmitter();
app.set("eventEmitter", eventEmitter);

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/", home);
app.use("/api/categories", categories);
app.use("/api/products", products);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/orders", orders);
app.use("/api/payment", payment);
app.use(error);

const port = process.env.PORT || 4000;
const server = app.listen(port, () =>
  console.log(`Listening on port ${port}...`)
);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("join", (roomName) => {
    socket.join(roomName);
  });
});

eventEmitter.on("orderUpdated", (order) => {
  io.to(`${order.user._id}_orders`).emit("orderUpdated", order);
});

eventEmitter.on("orderPlaced", (order) => {
  io.to(`adminRoom`).emit("orderPlaced", order);
});
