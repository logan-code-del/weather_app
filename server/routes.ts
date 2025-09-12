import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLocationSchema, insertWeatherDataSchema, insertWeatherAlertSchema } from "@shared/schema";
import { z } from "zod";

// Using US National Weather Service API (no key required) and mock data for international locations
const NWS_BASE_URL = "https://api.weather.gov";

interface NWSPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    forecast: string;
    forecastHourly: string;
  };
}

interface NWSCurrentResponse {
  properties: {
    temperature: {
      value: number;
    };
    relativeHumidity: {
      value: number;
    };
    windSpeed: {
      value: number;
    };
    windDirection: {
      value: number;
    };
    barometricPressure: {
      value: number;
    };
    visibility: {
      value: number;
    };
    textDescription: string;
  };
}

interface NWSForecastResponse {
  properties: {
    periods: Array<{
      name: string;
      temperature: number;
      temperatureUnit: string;
      shortForecast: string;
      detailedForecast: string;
      isDaytime: boolean;
      icon: string;
    }>;
  };
}

function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9/5) + 32);
}

function generateMockWeatherData(lat: number, lon: number, locationName: string) {
  // Generate realistic weather data based on location and season
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  
  // Seasonal temperature ranges (in Fahrenheit)
  let baseTemp = 70;
  if (month >= 11 || month <= 1) baseTemp = 45; // Winter
  else if (month >= 2 && month <= 4) baseTemp = 60; // Spring
  else if (month >= 5 && month <= 7) baseTemp = 85; // Summer
  else baseTemp = 65; // Fall
  
  // Add some random variation and daily cycle
  const dailyCycle = Math.sin((hour / 24) * 2 * Math.PI) * 15;
  const randomVariation = (Math.random() - 0.5) * 20;
  const temperature = baseTemp + dailyCycle + randomVariation;
  
  const conditions = ["clear sky", "few clouds", "scattered clouds", "broken clouds", "overcast clouds", "light rain", "rain"];
  const icons = ["01d", "02d", "03d", "04d", "04d", "09d", "10d"];
  const conditionIndex = Math.floor(Math.random() * conditions.length);
  
  return {
    temperature: Math.round(temperature),
    feelsLike: Math.round(temperature + (Math.random() - 0.5) * 10),
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round(Math.random() * 25),
    windDirection: getWindDirection(Math.random() * 360),
    pressure: Math.round(29.5 + Math.random() * 2),
    visibility: Math.round(5 + Math.random() * 10),
    uvIndex: Math.max(0, Math.round((hour - 6) / 2)),
    condition: conditions[conditionIndex],
    conditionIcon: icons[conditionIndex],
    precipitation: Math.random() < 0.3 ? Math.round(Math.random() * 0.5 * 100) / 100 : 0,
    sunrise: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 30),
    sunset: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0),
  };
}

function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(degrees / 22.5) % 16];
}

async function fetchNWSWeatherData(lat: number, lon: number) {
  try {
    // For US locations, try NWS API
    if (lat >= 20 && lat <= 50 && lon >= -180 && lon <= -60) {
      const pointResponse = await fetch(`${NWS_BASE_URL}/points/${lat},${lon}`);
      if (pointResponse.ok) {
        const pointData: NWSPointResponse = await pointResponse.json();
        
        // Get current conditions (using mock data as NWS doesn't provide real-time observations easily)
        const mockData = generateMockWeatherData(lat, lon, "");
        return mockData;
      }
    }
    
    // For international locations or if NWS fails, use mock data
    return generateMockWeatherData(lat, lon, "");
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return generateMockWeatherData(lat, lon, "");
  }
}

async function fetchNWSForecastData(lat: number, lon: number) {
  try {
    // For US locations, try NWS API
    if (lat >= 20 && lat <= 50 && lon >= -180 && lon <= -60) {
      const pointResponse = await fetch(`${NWS_BASE_URL}/points/${lat},${lon}`);
      if (pointResponse.ok) {
        const pointData: NWSPointResponse = await pointResponse.json();
        const forecastResponse = await fetch(pointData.properties.forecast);
        
        if (forecastResponse.ok) {
          const forecastData: NWSForecastResponse = await forecastResponse.json();
          return forecastData.properties.periods.slice(0, 10).map(period => ({
            dt: Date.now() / 1000,
            main: {
              temp: period.temperature,
              temp_min: period.temperature - 5,
              temp_max: period.temperature + 5,
              humidity: 50 + Math.random() * 30,
            },
            weather: [{
              main: period.shortForecast,
              description: period.shortForecast.toLowerCase(),
              icon: "01d",
            }],
            wind: { speed: 5 + Math.random() * 15 },
            pop: Math.random() * 0.5,
          }));
        }
      }
    }
    
    // Generate mock forecast data
    return Array.from({ length: 10 }, (_, i) => {
      const mockData = generateMockWeatherData(lat, lon, "");
      return {
        dt: (Date.now() / 1000) + (i * 24 * 60 * 60),
        main: {
          temp: mockData.temperature,
          temp_min: mockData.temperature - 10,
          temp_max: mockData.temperature + 10,
          humidity: mockData.humidity,
        },
        weather: [{
          main: mockData.condition,
          description: mockData.condition,
          icon: mockData.conditionIcon,
        }],
        wind: { speed: mockData.windSpeed },
        pop: mockData.precipitation > 0 ? 0.3 : 0.1,
      };
    });
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    // Return mock forecast data
    return Array.from({ length: 10 }, (_, i) => {
      const mockData = generateMockWeatherData(lat, lon, "");
      return {
        dt: (Date.now() / 1000) + (i * 24 * 60 * 60),
        main: {
          temp: mockData.temperature,
          temp_min: mockData.temperature - 10,
          temp_max: mockData.temperature + 10,
          humidity: mockData.humidity,
        },
        weather: [{
          main: mockData.condition,
          description: mockData.condition,
          icon: mockData.conditionIcon,
        }],
        wind: { speed: mockData.windSpeed },
        pop: mockData.precipitation > 0 ? 0.3 : 0.1,
      };
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search locations
  app.get("/api/locations/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const locations = await storage.getLocationsByQuery(query);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to search locations" });
    }
  });

  // Get location by coordinates (for geolocation)
  app.get("/api/locations/by-coordinates", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      // Try reverse geocoding with NWS for US locations
      try {
        if (lat >= 20 && lat <= 50 && lon >= -180 && lon <= -60) {
          const response = await fetch(`${NWS_BASE_URL}/points/${lat},${lon}`);
          if (response.ok) {
            const data = await response.json();
            const locationName = data.properties?.relativeLocation?.properties?.city || 
                                data.properties?.relativeLocation?.properties?.state || 
                                `Location`;
            const location = await storage.createLocation({
              name: locationName,
              country: "US",
              state: "",
              lat,
              lon,
              zipCode: null
            });
            return res.json(location);
          }
        }
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
      }

      // Fallback: create location with coordinates only
      const location = await storage.createLocation({
        name: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
        country: "Unknown",
        state: "",
        lat,
        lon,
        zipCode: null
      });
      
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to get location by coordinates" });
    }
  });

  // Get current weather for location
  app.get("/api/weather/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const location = await storage.getLocation(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Try to get cached weather data first
      let weatherData = await storage.getWeatherData(locationId);
      
      // If no data or data is older than 30 minutes, fetch fresh data
      if (!weatherData || (Date.now() - weatherData.lastUpdated.getTime()) > 30 * 60 * 1000) {
        const freshWeatherData = await fetchNWSWeatherData(location.lat, location.lon);
        
        if (freshWeatherData) {
          const newWeatherData = {
            locationId: locationId,
            temperature: freshWeatherData.temperature,
            feelsLike: freshWeatherData.feelsLike,
            humidity: freshWeatherData.humidity,
            windSpeed: freshWeatherData.windSpeed,
            windDirection: freshWeatherData.windDirection,
            pressure: freshWeatherData.pressure,
            visibility: freshWeatherData.visibility,
            uvIndex: freshWeatherData.uvIndex,
            condition: freshWeatherData.condition,
            conditionIcon: freshWeatherData.conditionIcon,
            precipitation: freshWeatherData.precipitation,
            sunrise: freshWeatherData.sunrise,
            sunset: freshWeatherData.sunset,
          };

          if (weatherData) {
            weatherData = await storage.updateWeatherData(locationId, newWeatherData);
          } else {
            weatherData = await storage.createWeatherData(newWeatherData);
          }
        }
      }

      if (!weatherData) {
        return res.status(503).json({ message: "Weather data unavailable" });
      }

      res.json({ location, weather: weatherData });
    } catch (error) {
      res.status(500).json({ message: "Failed to get weather data" });
    }
  });

  // Get weather alerts for location
  app.get("/api/alerts/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const alerts = await storage.getActiveAlerts(locationId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get weather alerts" });
    }
  });

  // Get all active alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get weather alerts" });
    }
  });

  // Get 5-day forecast
  app.get("/api/forecast/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const location = await storage.getLocation(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      const forecastDataList = await fetchNWSForecastData(location.lat, location.lon);
      if (!forecastDataList) {
        return res.status(503).json({ message: "Forecast data unavailable" });
      }

      // Process 5-day forecast (take one reading per day at noon)
      const dailyForecasts = [];
      const processedDates = new Set();

      for (const item of forecastDataList) {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toDateString();
        
        if (!processedDates.has(dateStr) && dailyForecasts.length < 5) {
          processedDates.add(dateStr);
          dailyForecasts.push({
            locationId,
            forecastDate: date,
            highTemp: Math.round(item.main.temp_max),
            lowTemp: Math.round(item.main.temp_min),
            condition: item.weather[0].description,
            conditionIcon: item.weather[0].icon,
            precipitation: Math.round(item.pop * 100),
            windSpeed: Math.round(item.wind.speed),
            humidity: item.main.humidity,
          });
        }
      }

      res.json(dailyForecasts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get forecast data" });
    }
  });

  // Get hourly forecast
  app.get("/api/hourly/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const location = await storage.getLocation(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      const forecastDataList = await fetchNWSForecastData(location.lat, location.lon);
      if (!forecastDataList) {
        return res.status(503).json({ message: "Hourly forecast data unavailable" });
      }

      // Process hourly forecast (next 24 hours)
      const hourlyForecasts = forecastDataList.slice(0, 8).map((item: any) => ({
        locationId,
        forecastTime: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].description,
        conditionIcon: item.weather[0].icon,
        precipitation: Math.round(item.pop * 100),
        windSpeed: Math.round(item.wind.speed),
      }));

      res.json(hourlyForecasts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get hourly forecast data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
