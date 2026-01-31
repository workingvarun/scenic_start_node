require("dotenv").config();

const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const apiRoutes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

/* health MUST be root */
app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

/* NO /api PREFIX HERE */
app.use("/", apiRoutes);

module.exports = serverless(app);
