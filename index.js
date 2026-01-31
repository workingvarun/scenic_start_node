require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");

const apiRoutes = require("./api");
const swaggerSpec = require("./swagger");
const { connectDB, initDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 9091;

/* ---------- CORS ---------- */
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow server-to-server, Swagger UI, Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Secret"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ---------- BODY PARSERS ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- ROUTES ---------- */
app.get("/", (_req, res) => {
  res.send("Hello World!");
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

/* ---------- SWAGGER ---------- */
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

/* ---------- BOOTSTRAP ---------- */
(async () => {
  try {
    await connectDB();
    await initDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`Swagger at http://localhost:${PORT}/api-docs`);
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
