import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "@/lib/weather-api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, Zap, Wind, Snowflake } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WeatherAlertsProps {
  locationId?: string;
}

export default function WeatherAlerts({ locationId }: WeatherAlertsProps) {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts", locationId],
    queryFn: () => weatherApi.getWeatherAlerts(locationId),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return <Zap className="text-xl" />;
      case "moderate":
        return <Wind className="text-lg" />;
      case "minor":
        return <Snowflake className="text-lg" />;
      default:
        return <AlertTriangle className="text-lg" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return "alert-severe";
      case "moderate":
        return "alert-moderate";
      case "minor":
        return "alert-minor";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="weather-alerts-loading">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-muted rounded-lg">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="weather-alerts">
      <CardHeader className="px-4 py-3 bg-muted border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <AlertTriangle className="text-warning mr-2" />
          Weather Alerts
        </h2>
      </CardHeader>
      
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active weather alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={cn("p-4", getSeverityClass(alert.severity))}
                data-testid={`alert-${alert.severity}-${index}`}
              >
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" data-testid={`text-alert-title-${index}`}>
                      {alert.title}
                    </h3>
                    <p className="text-xs opacity-90 mt-1" data-testid={`text-alert-duration-${index}`}>
                      Until {formatTimeUntil(alert.endTime)}
                    </p>
                    <p className="text-xs mt-2 opacity-90" data-testid={`text-alert-description-${index}`}>
                      {alert.description}
                    </p>
                    {alert.areas && Array.isArray(alert.areas) && alert.areas.length > 0 && (
                      <div className="mt-2">
                        {(alert.areas as string[]).map((area, areaIndex) => (
                          <span
                            key={areaIndex}
                            className="text-xs px-2 py-1 bg-black bg-opacity-20 rounded-full mr-1"
                            data-testid={`text-alert-area-${index}-${areaIndex}`}
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {alerts.length > 0 && (
          <div className="px-4 py-3 bg-muted border-t border-border">
            <button 
              className="text-sm text-primary hover:underline"
              data-testid="button-view-all-alerts"
            >
              View all alerts
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
