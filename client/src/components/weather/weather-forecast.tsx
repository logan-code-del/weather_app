import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "@/lib/weather-api";
import { useSettings } from "@/contexts/settings-context";
import { getTemperatureInUnit } from "@/lib/temperature";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, Droplets, Sun, Cloud, CloudRain, Snowflake } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherForecastProps {
  locationId: string;
}

export default function WeatherForecast({ locationId }: WeatherForecastProps) {
  const { settings } = useSettings();
  const { data: forecast = [], isLoading: forecastLoading } = useQuery({
    queryKey: ["/api/forecast", locationId],
    queryFn: () => weatherApi.getForecast(locationId),
    refetchInterval: settings.autoRefreshInterval * 60 * 1000, // Use user's refresh interval
  });

  const { data: hourly = [], isLoading: hourlyLoading } = useQuery({
    queryKey: ["/api/hourly", locationId],
    queryFn: () => weatherApi.getHourlyForecast(locationId),
    refetchInterval: settings.autoRefreshInterval * 60 * 1000, // Use user's refresh interval
  });

  const getWeatherIcon = (icon?: string, condition?: string) => {
    if (icon) {
      return (
        <img 
          src={`https://openweathermap.org/img/wn/${icon}.png`}
          alt={condition || "Weather"}
          className="w-8 h-8 mx-auto"
        />
      );
    }
    
    // Fallback icons based on condition
    const conditionLower = condition?.toLowerCase() || "";
    if (conditionLower.includes("rain")) return <CloudRain className="w-6 h-6 mx-auto text-blue-600" />;
    if (conditionLower.includes("snow")) return <Snowflake className="w-6 h-6 mx-auto text-blue-300" />;
    if (conditionLower.includes("cloud")) return <Cloud className="w-6 h-6 mx-auto text-gray-500" />;
    return <Sun className="w-6 h-6 mx-auto text-yellow-500" />;
  };

  const formatDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const forecastDate = new Date(date);
    
    if (forecastDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (forecastDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return forecastDate.toLocaleDateString("en-US", { weekday: "long" });
    }
  };

  const formatHourTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  if (forecastLoading && hourlyLoading) {
    return (
      <div className="space-y-6">
        {/* 5-Day Forecast Skeleton */}
        <Card data-testid="forecast-loading">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-lg p-4 text-center space-y-2">
                  <Skeleton className="h-4 w-16 mx-auto" />
                  <Skeleton className="h-8 w-8 mx-auto" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                  <Skeleton className="h-4 w-8 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Forecast Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 p-3 bg-muted rounded-lg min-w-[80px] space-y-2">
                  <Skeleton className="h-3 w-8 mx-auto" />
                  <Skeleton className="h-6 w-6 mx-auto" />
                  <Skeleton className="h-4 w-6 mx-auto" />
                  <Skeleton className="h-3 w-6 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 5-Day Forecast */}
      <Card className="overflow-hidden" data-testid="forecast-5-day">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <Calendar className="text-primary mr-2" />
            5-Day Forecast
          </h2>
        </CardHeader>
        
        <CardContent className="p-6">
          {forecast.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Forecast data unavailable</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="bg-muted rounded-lg p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  data-testid={`forecast-day-${index}`}
                >
                  <div className="text-sm font-medium mb-2" data-testid={`text-day-name-${index}`}>
                    {formatDayName(day.forecastDate)}
                  </div>
                  <div className="mb-2">
                    {getWeatherIcon(day.conditionIcon, day.condition)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 capitalize" data-testid={`text-day-condition-${index}`}>
                    {day.condition}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold" data-testid={`text-day-high-${index}`}>
                      {Math.round(getTemperatureInUnit(day.highTemp, settings.temperatureUnit))}°
                    </span>
                    <span className="text-muted-foreground" data-testid={`text-day-low-${index}`}>
                      {Math.round(getTemperatureInUnit(day.lowTemp, settings.temperatureUnit))}°
                    </span>
                  </div>
                  <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                    <Droplets className="mr-1 h-3 w-3" />
                    <span data-testid={`text-day-precipitation-${index}`}>
                      {day.precipitation}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hourly Forecast */}
      <Card className="overflow-hidden" data-testid="forecast-hourly">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <Clock className="text-primary mr-2" />
            Hourly Forecast
          </h2>
        </CardHeader>
        
        <CardContent className="p-6">
          {hourly.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hourly forecast unavailable</p>
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {hourly.map((hour, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 text-center p-3 bg-muted rounded-lg min-w-[80px]"
                  data-testid={`forecast-hour-${index}`}
                >
                  <div className="text-xs text-muted-foreground mb-2" data-testid={`text-hour-time-${index}`}>
                    {formatHourTime(hour.forecastTime)}
                  </div>
                  <div className="mb-2">
                    {getWeatherIcon(hour.conditionIcon, hour.condition)}
                  </div>
                  <div className="text-sm font-medium mb-1" data-testid={`text-hour-temp-${index}`}>
                    {Math.round(getTemperatureInUnit(hour.temperature, settings.temperatureUnit))}°
                  </div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <Droplets className="mr-1 h-3 w-3" />
                    <span data-testid={`text-hour-precipitation-${index}`}>
                      {hour.precipitation}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
