require("dotenv").config();

const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const apiRoutes = require("./api");

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- ROUTES ---------- */
app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

/* ---------- EXPORT ---------- */
module.exports = serverless(app);
