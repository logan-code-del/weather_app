import { apiRequest } from "./queryClient";
import { Location, WeatherData, WeatherAlert, ForecastData, HourlyForecast } from "@shared/schema";

export interface WeatherResponse {
  location: Location;
  weather: WeatherData;
}

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export const weatherApi = {
  searchLocations: async (query: string): Promise<Location[]> => {
    const response = await apiRequest("GET", `/api/locations/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  getLocationByCoords: async (coords: GeolocationCoords): Promise<Location> => {
    const response = await apiRequest("GET", `/api/locations/by-coordinates?lat=${coords.latitude}&lon=${coords.longitude}`);
    return response.json();
  },

  getCurrentWeather: async (locationId: string): Promise<WeatherResponse> => {
    const response = await apiRequest("GET", `/api/weather/${locationId}`);
    return response.json();
  },

  getWeatherAlerts: async (locationId?: string): Promise<WeatherAlert[]> => {
    const endpoint = locationId ? `/api/alerts/${locationId}` : "/api/alerts";
    const response = await apiRequest("GET", endpoint);
    return response.json();
  },

  getForecast: async (locationId: string): Promise<ForecastData[]> => {
    const response = await apiRequest("GET", `/api/forecast/${locationId}`);
    return response.json();
  },

  getHourlyForecast: async (locationId: string): Promise<HourlyForecast[]> => {
    const response = await apiRequest("GET", `/api/hourly/${locationId}`);
    return response.json();
  },
};

export const getCurrentLocation = (): Promise<GeolocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};
