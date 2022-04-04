const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require("./db");
const path = require("path");
const { notEqual } = require("assert");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/:userid/notes", async (req, res, next) => {
  try {
    res.send(
      await Note.findAll({
        where: {
          userId: req.params.userid,
        },
      })
    );
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
