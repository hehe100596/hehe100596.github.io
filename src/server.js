import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import logger from "morgan";

import routes from "./routes";

export const app = express();

export let server = null;

require("dotenv").config();

app.use(cors());

const API_PORT = process.env.PORT;
const dbRoute = process.env.DB_ROUTE;

function tryConnection() {
  mongoose
    .connect(dbRoute, {
      poolSize: 100,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      serverSelectionTimeoutMS: 600000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(
      () =>
        (server = app.listen(API_PORT, () =>
          console.log(`Connection established - listening on port: ${API_PORT}`)
        ))
    )
    .catch((err) => ({}));
}
tryConnection();

let db = mongoose.connection;

db.on("error", () => {
  console.log("Failed to connect - retrying in 5 seconds...");
  setTimeout(tryConnection, 5000);
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

app.use(routes);
app.use("/api", routes);
