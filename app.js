/**
 * Module dependencies.
 */

const express = require("express");
const http = require("http");
const routes = require("./routes");

const app = express();

// all environments
app.set("port", process.env.PORT || 3012);
app.set("views", `${__dirname}/views`);
app.set("view engine", "jade");

routes.index();

http.createServer(app).listen(app.get("port"), () => {
  console.log(`Express server listening on port ${app.get("port")}`);
});
