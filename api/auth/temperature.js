const axios = require("axios");
const temperatureRouter = require("express").Router();

/**
 * @swagger
 * /api/auth/temperature:
 *   get:
 *     summary: Get current temperature based on client IP
 *     tags:
 *       - Utilities
 *     security:
 *       - bearerAuth: []
 */
temperatureRouter.get("/", async (req, res) => {
  let clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  // Local dev fallback
  if (clientIP === "::1" || clientIP === "127.0.0.1") {
    clientIP = "108.181.48.97";
  }

  if (!process.env.OPENWEATHER_API) {
    return res.status(500).json({ message: "Weather service not configured" });
  }

  try {
    const latlongData = await fetchLatLong(clientIP);

    if (!latlongData?.latitude || !latlongData?.longitude) {
      return res.status(500).json({ message: "Unable to resolve location" });
    }

    const weatherData = await fetchWeatherInfo(latlongData);

    // Return only what you actually need
    return res.status(200).json(weatherData);
  } catch (err) {
    console.error("Temperature error:", err.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch temperature data" });
  }
});

async function fetchLatLong(IP) {
  const { data } = await axios.get(`https://ipwhois.app/json/${IP}`, {
    timeout: 5000,
    proxy: false,
  });

  return data;
}

async function fetchWeatherInfo({ latitude, longitude }) {
  const { data } = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather",
    {
      params: {
        lat: latitude,
        lon: longitude,
        appid: process.env.OPENWEATHER_API,
        units: "metric",
      },
      timeout: 5000,
    },
  );

  return data;
}

module.exports = temperatureRouter;
