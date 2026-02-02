const axios = require("axios");
const temperatureRouter = require("express").Router();

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache) {
    if (value.timestamp && now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // every 1 minute

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
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
  
  // Normalize IPv6-mapped IPv4 addresses
  clientIP = clientIP.replace(/^::ffff:/, "");

  // Check cache
  const cached = cache.get(clientIP);
  const now = Date.now();

  if (cached) {
    if (cached.timestamp && now - cached.timestamp < CACHE_TTL) {
      return res.status(200).json(cached.data);
    }
    // Remove expired entry
    cache.delete(clientIP);
  }

  // Prevent duplicate requests: store a pending promise
  if (!cache.has(clientIP)) {
    cache.set(clientIP, fetchTemperature(clientIP));
  }

  try {
    const weatherData = await cache.get(clientIP);
    return res.status(200).json(weatherData);
  } catch (err) {
    // Remove failed promise from cache
    cache.delete(clientIP);
    console.error("Temperature error:", err.message);
    return res.status(500).json({ message: "Failed to fetch temperature data" });
  }
});

// Fetch lat/long and weather info
async function fetchTemperature(IP) {
  const latlongData = await fetchLatLong(IP);

  if (!latlongData?.latitude || !latlongData?.longitude) {
    throw new Error("Unable to resolve location");
  }

  const weatherData = await fetchWeatherInfo(latlongData);
  const now = Date.now();

  // Cache the resolved data
  cache.set(IP, { data: weatherData, timestamp: now });
  weatherData.timestamp = now;

  return weatherData;
}

async function fetchLatLong(IP) {
  const { data } = await axios.get(`https://ipwhois.app/json/${IP}`, {
    timeout: 5000,
    proxy: false,
  });
  return data;
}

async function fetchWeatherInfo({ latitude, longitude }) {
  const { data } = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
    params: {
      lat: latitude,
      lon: longitude,
      exclude: "minutely,alerts",
      appid: process.env.OPENWEATHER_API,
      units: "metric",
    },
    timeout: 5000,
  });
  return data;
}

module.exports = temperatureRouter;
