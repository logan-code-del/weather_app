import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { weatherApi } from "@/lib/weather-api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, Zap, Wind, Snowflake, Bell, BellRing } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAlertNotifications } from "@/hooks/use-alert-notifications";
import { useSettings } from "@/contexts/settings-context";

interface WeatherAlertsProps {
  locationId?: string;
}

export default function WeatherAlerts({ locationId }: WeatherAlertsProps) {
  const { settings } = useSettings();
  const { 
    checkForNewAlerts, 
    hasActiveAlerts, 
    getActiveAlertCount, 
    getHighestSeverity 
  } = useAlertNotifications();

  const { data: locationAlerts = [], isLoading: isLocationLoading } = useQuery({
    queryKey: ["/api/alerts", locationId],
    queryFn: () => weatherApi.getWeatherAlerts(locationId),
    refetchInterval: settings.notificationsEnabled ? 60 * 1000 : 5 * 60 * 1000, // Check every minute if notifications enabled, otherwise every 5 minutes
    enabled: !!locationId,
  });

  const { data: globalAlerts = [], isLoading: isGlobalLoading } = useQuery({
    queryKey: ["/api/alerts"],
    queryFn: () => weatherApi.getWeatherAlerts(),
    refetchInterval: settings.notificationsEnabled ? 60 * 1000 : 5 * 60 * 1000,
    enabled: locationAlerts.length === 0, // Only fetch global alerts if no location alerts
  });

  const alerts = locationAlerts.length > 0 ? locationAlerts : globalAlerts;
  const isLoading = locationId ? isLocationLoading : isGlobalLoading;

  // Check for new alerts whenever alerts data changes
  useEffect(() => {
    if (alerts.length > 0) {
      checkForNewAlerts(alerts);
    }
  }, [alerts, checkForNewAlerts]);

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
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100";
      case "moderate":
        return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100";
      case "minor":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return "destructive";
      case "moderate":
        return "secondary";
      case "minor":
        return "outline";
      default:
        return "outline";
    }
  };

  const isAlertActive = (alert: any) => {
    const now = new Date();
    return new Date(alert.endTime) > now && new Date(alert.startTime) <= now;
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

  const renderAlertAreas = (areas: unknown, alertIndex: number) => {
    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-2">
        {(areas as string[]).map((area, areaIndex) => (
          <span
            key={areaIndex}
            className="text-xs px-2 py-1 bg-black dark:bg-white bg-opacity-20 dark:bg-opacity-20 rounded-full mr-1"
            data-testid={`text-alert-area-${alertIndex}-${areaIndex}`}
          >
            {String(area)}
          </span>
        ))}
      </div>
    );
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            {hasActiveAlerts(alerts) ? (
              <BellRing className={cn(
                "mr-2 animate-pulse",
                getHighestSeverity(alerts) === "severe" ? "text-red-500" :
                getHighestSeverity(alerts) === "moderate" ? "text-orange-500" :
                "text-blue-500"
              )} />
            ) : (
              <Bell className="text-muted-foreground mr-2" />
            )}
            Weather Alerts
          </h2>
          {hasActiveAlerts(alerts) && (
            <div className="flex items-center space-x-2">
              <Badge 
                variant={getSeverityBadgeVariant(getHighestSeverity(alerts))} 
                className="text-xs"
                data-testid="badge-active-alerts"
              >
                {getActiveAlertCount(alerts)} active
              </Badge>
              {settings.notificationsEnabled && (
                <Badge variant="outline" className="text-xs">
                  🔔 Live
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No weather alerts</p>
            {locationId && (
              <p className="text-xs mt-1 opacity-75">for selected location</p>
            )}
            {settings.notificationsEnabled && (
              <p className="text-xs mt-1 opacity-75">Monitoring for new alerts...</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert, index) => {
              const isActive = isAlertActive(alert);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 border-l-4 transition-all duration-200", 
                    getSeverityClass(alert.severity),
                    isActive && "shadow-sm",
                    !isActive && "opacity-60"
                  )}
                  data-testid={`alert-${alert.severity}-${index}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      {getSeverityIcon(alert.severity)}
                      {isActive && (
                        <div className="mt-1 w-2 h-2 bg-current rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm" data-testid={`text-alert-title-${index}`}>
                          {alert.title}
                        </h3>
                        <Badge 
                          variant={getSeverityBadgeVariant(alert.severity)}
                          className="text-xs ml-2"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-90 mt-1" data-testid={`text-alert-duration-${index}`}>
                        {isActive ? `Active until ${formatTimeUntil(alert.endTime)}` : 
                         new Date(alert.startTime) > new Date() ? `Starts ${new Date(alert.startTime).toLocaleTimeString()}` :
                         "Expired"}
                      </p>
                      <p className="text-xs mt-2 opacity-90" data-testid={`text-alert-description-${index}`}>
                        {alert.description}
                      </p>
                      {renderAlertAreas(alert.areas, index)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {alerts.length > 0 && (
          <div className="px-4 py-3 bg-muted border-t border-border flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {hasActiveAlerts(alerts) ? (
                `${getActiveAlertCount(alerts)} of ${alerts.length} alerts active`
              ) : (
                `${alerts.length} total alerts (none currently active)`
              )}
              {locationAlerts.length === 0 && globalAlerts.length > 0 && (
                <div className="mt-1 text-xs opacity-75">
                  Showing global alerts (no local alerts)
                </div>
              )}
            </div>
            {settings.notificationsEnabled && (
              <div className="text-xs text-muted-foreground flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live updates
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
