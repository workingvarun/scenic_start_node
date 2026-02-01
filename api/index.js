require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

// Swagger setup (only in non-production)
if (process.env.NODE_ENV !== "production") {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Scenic Start NodeJS",
        version: "1.0.0",
        description: "This is Scenic Start NodeJS application",
      },
      servers: [
        {
          // Use environment variable if provided, fallback to localhost
          url: process.env.BASE_URL || `http://localhost:${PORT}`,
        },
      ],
    },
    apis: ["./routes/*.js"], // Path to your routes with Swagger JSDoc
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger docs available at ${process.env.BASE_URL || `http://localhost:${PORT}`}/docs`);
}

// API routes (no /api prefix)
app.use("/", apiRoutes);

// Export app for Vercel
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
