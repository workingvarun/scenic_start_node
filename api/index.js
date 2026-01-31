require("dotenv").config();
const express = require("express");
const cors = require("cors");

const apiRoutes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

/* health check */
app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

/* IMPORTANT: no /api prefix */
app.use("/", apiRoutes);

/* THIS is all Vercel needs */
module.exports = app;
