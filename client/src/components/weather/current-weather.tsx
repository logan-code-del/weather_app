import { useQuery } from "@tanstack/react-query";
import { Location } from "@shared/schema";
import { weatherApi } from "@/lib/weather-api";
import { useSettings } from "@/contexts/settings-context";
import { formatTemperatureInUnit, getTemperatureInUnit } from "@/lib/temperature";
import { Card } from "@/components/ui/card";
import { MapPin, Droplets, Wind, Compass, CloudRain, Eye, Gauge, Sun, Sunrise, Sunset, Cloud } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentWeatherProps {
  location: Location;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function CurrentWeather({ location, isRefreshing }: CurrentWeatherProps) {
  const { settings } = useSettings();
  const { data: weatherData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/weather", location.id],
    queryFn: () => weatherApi.getCurrentWeather(location.id),
    refetchInterval: settings.autoRefreshInterval * 60 * 1000, // Use user's refresh interval
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden" data-testid="current-weather-loading">
        <div className="weather-gradient px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 bg-white/20" />
              <Skeleton className="h-16 w-32 bg-white/20" />
              <Skeleton className="h-4 w-40 bg-white/20" />
            </div>
            <Skeleton className="h-24 w-24 bg-white/20" />
          </div>
        </div>
        <div className="p-6 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card className="p-6 text-center" data-testid="current-weather-error">
        <div className="text-destructive mb-4">
          <Cloud className="h-12 w-12 mx-auto mb-2" />
          <p className="font-semibold">Weather data unavailable</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Failed to load weather data"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-primary hover:underline"
          data-testid="button-retry-weather"
        >
          Try again
        </button>
      </Card>
    );
  }

  const { weather } = weatherData;
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className="overflow-hidden" data-testid="current-weather">
      {/* Main Weather Display */}
      <div className="weather-gradient px-6 py-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="text-sm opacity-90" />
              <span className="text-sm opacity-90" data-testid="text-location-name">
                {location.name}
                {location.state && `, ${location.state}`}
              </span>
              <span className="text-xs opacity-75" data-testid="text-current-time">
                {currentTime}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-bold" data-testid="text-temperature">
                {Math.round(getTemperatureInUnit(weather.temperature, settings.temperatureUnit))}°
              </span>
              <span className="text-lg opacity-90">{settings.temperatureUnit === "fahrenheit" ? "F" : "C"}</span>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm opacity-90 capitalize" data-testid="text-condition">
                {weather.condition}
              </span>
              <span className="text-xs opacity-75">
                Feels like <span data-testid="text-feels-like">{Math.round(getTemperatureInUnit(weather.feelsLike, settings.temperatureUnit))}°</span>
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl opacity-90 mb-2">
              {weather.conditionIcon ? (
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.conditionIcon}@2x.png`}
                  alt={weather.condition}
                  className="w-16 h-16 mx-auto"
                  data-testid="img-weather-icon"
                />
              ) : (
                <Sun className="w-16 h-16 mx-auto" />
              )}
            </div>
            <div className="text-xs opacity-75">
              Last updated: <span data-testid="text-last-updated">
                {formatTime(weather.lastUpdated)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weather Details Grid */}
      <div className="p-6 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center" data-testid="stat-humidity">
            <Droplets className="text-blue-500 text-xl mb-2 mx-auto" />
            <div className="text-xs text-muted-foreground mb-1">Humidity</div>
            <div className="text-lg font-semibold">{weather.humidity}%</div>
          </div>
          <div className="text-center" data-testid="stat-wind-speed">
            <Wind className="text-green-500 text-xl mb-2 mx-auto" />
            <div className="text-xs text-muted-foreground mb-1">Wind Speed</div>
            <div className="text-lg font-semibold">{Math.round(weather.windSpeed)} mph</div>
          </div>
          <div className="text-center" data-testid="stat-wind-direction">
            <Compass className="text-purple-500 text-xl mb-2 mx-auto" />
            <div className="text-xs text-muted-foreground mb-1">Wind Direction</div>
            <div className="text-lg font-semibold">{weather.windDirection}</div>
          </div>
          <div className="text-center" data-testid="stat-precipitation">
            <CloudRain className="text-blue-600 text-xl mb-2 mx-auto" />
            <div className="text-xs text-muted-foreground mb-1">Precipitation</div>
            <div className="text-lg font-semibold">{weather.precipitation} in</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Today's Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                <Eye className="mr-2 h-3 w-3" />
                Visibility
              </span>
              <span className="font-medium" data-testid="text-visibility">
                {weather.visibility} mi
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                <Gauge className="mr-2 h-3 w-3" />
                Pressure
              </span>
              <span className="font-medium" data-testid="text-pressure">
                {weather.pressure} in
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                <Sun className="mr-2 h-3 w-3" />
                UV Index
              </span>
              <span className="font-medium" data-testid="text-uv-index">
                {weather.uvIndex}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                <Sunrise className="mr-2 h-3 w-3" />
                Sunrise
              </span>
              <span className="font-medium" data-testid="text-sunrise">
                {formatTime(weather.sunrise)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                <Sunset className="mr-2 h-3 w-3" />
                Sunset
              </span>
              <span className="font-medium" data-testid="text-sunset">
                {formatTime(weather.sunset)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
