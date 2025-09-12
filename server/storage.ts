import { 
  type Location, 
  type InsertLocation,
  type WeatherData, 
  type InsertWeatherData,
  type WeatherAlert,
  type InsertWeatherAlert,
  type ForecastData,
  type InsertForecastData,
  type HourlyForecast,
  type InsertHourlyForecast
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Location methods
  getLocation(id: string): Promise<Location | undefined>;
  getLocationByName(name: string): Promise<Location | undefined>;
  getLocationsByQuery(query: string): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Weather data methods
  getWeatherData(locationId: string): Promise<WeatherData | undefined>;
  createWeatherData(weatherData: InsertWeatherData): Promise<WeatherData>;
  updateWeatherData(locationId: string, weatherData: Partial<WeatherData>): Promise<WeatherData | undefined>;
  
  // Weather alerts methods
  getActiveAlerts(locationId: string): Promise<WeatherAlert[]>;
  getAllActiveAlerts(): Promise<WeatherAlert[]>;
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  
  // Forecast methods
  getForecastData(locationId: string): Promise<ForecastData[]>;
  createForecastData(forecast: InsertForecastData): Promise<ForecastData>;
  
  // Hourly forecast methods
  getHourlyForecast(locationId: string): Promise<HourlyForecast[]>;
  createHourlyForecast(hourly: InsertHourlyForecast): Promise<HourlyForecast>;
}

export class MemStorage implements IStorage {
  private locations: Map<string, Location> = new Map();
  private weatherData: Map<string, WeatherData> = new Map();
  private weatherAlerts: Map<string, WeatherAlert> = new Map();
  private forecastData: Map<string, ForecastData> = new Map();
  private hourlyForecast: Map<string, HourlyForecast> = new Map();

  constructor() {
    // Initialize with some default locations
    const defaultLocations = [
      { name: "New York", country: "US", state: "NY", lat: 40.7128, lon: -74.0060, zipCode: "10001" },
      { name: "Los Angeles", country: "US", state: "CA", lat: 34.0522, lon: -118.2437, zipCode: "90001" },
      { name: "Chicago", country: "US", state: "IL", lat: 41.8781, lon: -87.6298, zipCode: "60601" },
    ];

    const locationIds: string[] = [];
    defaultLocations.forEach(loc => {
      const id = randomUUID();
      const location: Location = { 
        ...loc, 
        id,
        state: loc.state,
        zipCode: loc.zipCode
      };
      this.locations.set(id, location);
      locationIds.push(id);
    });

    // Add sample weather alerts
    const sampleAlerts = [
      {
        locationId: locationIds[0], // New York
        title: "Winter Storm Warning",
        description: "Heavy snow expected. Travel may be difficult due to snow-covered roads.",
        severity: "severe",
        category: "Met",
        areas: ["Manhattan", "Brooklyn", "Queens"],
        startTime: new Date(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        isActive: 1,
      },
      {
        locationId: locationIds[1], // Los Angeles
        title: "Heat Advisory",
        description: "Temperatures may reach dangerous levels. Stay hydrated and avoid prolonged sun exposure.",
        severity: "moderate",
        category: "Met",
        areas: ["Downtown LA", "Hollywood", "Santa Monica"],
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        isActive: 1,
      },
      {
        locationId: locationIds[2], // Chicago
        title: "Wind Advisory",
        description: "Strong winds may cause scattered power outages and downed tree limbs.",
        severity: "minor",
        category: "Met",
        areas: ["Cook County", "Lake County"],
        startTime: new Date(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        isActive: 1,
      },
    ];

    sampleAlerts.forEach(alert => {
      const id = randomUUID();
      const weatherAlert: WeatherAlert = { 
        ...alert, 
        id,
        isActive: alert.isActive
      };
      this.weatherAlerts.set(id, weatherAlert);
    });
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationByName(name: string): Promise<Location | undefined> {
    return Array.from(this.locations.values()).find(
      (location) => location.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async getLocationsByQuery(query: string): Promise<Location[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.locations.values()).filter(
      (location) => 
        location.name.toLowerCase().includes(queryLower) ||
        location.state?.toLowerCase().includes(queryLower) ||
        location.zipCode?.includes(query)
    ).slice(0, 5);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = { 
      ...insertLocation, 
      id,
      state: insertLocation.state ?? null,
      zipCode: insertLocation.zipCode ?? null
    };
    this.locations.set(id, location);
    return location;
  }

  async getWeatherData(locationId: string): Promise<WeatherData | undefined> {
    return Array.from(this.weatherData.values()).find(
      (weather) => weather.locationId === locationId
    );
  }

  async createWeatherData(insertWeatherData: InsertWeatherData): Promise<WeatherData> {
    const id = randomUUID();
    const weatherData: WeatherData = { 
      ...insertWeatherData, 
      id,
      lastUpdated: new Date()
    };
    this.weatherData.set(id, weatherData);
    return weatherData;
  }

  async updateWeatherData(locationId: string, updates: Partial<WeatherData>): Promise<WeatherData | undefined> {
    const existing = await this.getWeatherData(locationId);
    if (existing) {
      const updated: WeatherData = { ...existing, ...updates, lastUpdated: new Date() };
      this.weatherData.set(existing.id, updated);
      return updated;
    }
    return undefined;
  }

  async getActiveAlerts(locationId: string): Promise<WeatherAlert[]> {
    return Array.from(this.weatherAlerts.values()).filter(
      (alert) => alert.locationId === locationId && alert.isActive === 1
    );
  }

  async getAllActiveAlerts(): Promise<WeatherAlert[]> {
    return Array.from(this.weatherAlerts.values()).filter(
      (alert) => alert.isActive === 1
    );
  }

  async createWeatherAlert(insertAlert: InsertWeatherAlert): Promise<WeatherAlert> {
    const id = randomUUID();
    const alert: WeatherAlert = { 
      ...insertAlert, 
      id,
      isActive: insertAlert.isActive ?? 1
    };
    this.weatherAlerts.set(id, alert);
    return alert;
  }

  async getForecastData(locationId: string): Promise<ForecastData[]> {
    return Array.from(this.forecastData.values()).filter(
      (forecast) => forecast.locationId === locationId
    ).sort((a, b) => a.forecastDate.getTime() - b.forecastDate.getTime());
  }

  async createForecastData(insertForecast: InsertForecastData): Promise<ForecastData> {
    const id = randomUUID();
    const forecast: ForecastData = { ...insertForecast, id };
    this.forecastData.set(id, forecast);
    return forecast;
  }

  async getHourlyForecast(locationId: string): Promise<HourlyForecast[]> {
    return Array.from(this.hourlyForecast.values()).filter(
      (hourly) => hourly.locationId === locationId
    ).sort((a, b) => a.forecastTime.getTime() - b.forecastTime.getTime());
  }

  async createHourlyForecast(insertHourly: InsertHourlyForecast): Promise<HourlyForecast> {
    const id = randomUUID();
    const hourly: HourlyForecast = { ...insertHourly, id };
    this.hourlyForecast.set(id, hourly);
    return hourly;
  }
}

export const storage = new MemStorage();
