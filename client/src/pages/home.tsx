import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Location } from "@shared/schema";
import { weatherApi, getCurrentLocation } from "@/lib/weather-api";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
import LocationSearch from "@/components/weather/location-search";
import CurrentWeather from "@/components/weather/current-weather";
import WeatherAlerts from "@/components/weather/weather-alerts";
import WeatherForecast from "@/components/weather/weather-forecast";
import WeatherMap from "@/components/weather/weather-map";
import SettingsModal from "@/components/settings-modal";
import { CloudSun, RefreshCw, Settings, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();

  // Try to get user's current location on first load
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        if (settings.autoDetectLocation) {
          const coords = await getCurrentLocation();
          const location = await weatherApi.getLocationByCoords(coords);
          setSelectedLocation(location);
        }
      } catch (error) {
        // Silently fall back to default location or show search
        console.log("Could not get current location:", error);
      }
    };

    initializeLocation();
  }, [settings.autoDetectLocation]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsRefreshing(true);
      const coords = await getCurrentLocation();
      const location = await weatherApi.getLocationByCoords(coords);
      setSelectedLocation(location);
      toast({
        title: "Location updated",
        description: `Now showing weather for ${location.name}`,
      });
    } catch (error) {
      toast({
        title: "Location error",
        description: "Could not get your current location. Please search manually.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Refresh will be handled by React Query's refetch
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50" data-testid="weather-app">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CloudSun className="text-primary text-2xl" />
                <h1 className="text-xl font-bold text-foreground">WeatherScope</h1>
              </div>
            </div>
            
            <div className="flex-1 max-w-md mx-4">
              <LocationSearch onLocationSelect={handleLocationSelect} />
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh data"
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Weather Alerts Panel */}
          <div className="lg:col-span-1 space-y-4">
            <WeatherAlerts locationId={selectedLocation?.id} />
          </div>

          {/* Main Weather Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedLocation && (
              <>
                <CurrentWeather 
                  location={selectedLocation}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                />
                <WeatherMap location={selectedLocation} />
                <WeatherForecast locationId={selectedLocation.id} />
              </>
            )}
            
            {!selectedLocation && (
              <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center">
                <CloudSun className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to WeatherScope</h2>
                <p className="text-muted-foreground mb-4">
                  Search for a location above or use your current location to get started.
                </p>
                <Button 
                  onClick={handleGetCurrentLocation}
                  disabled={isRefreshing}
                  data-testid="button-current-location"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Floating Action Button */}
      {selectedLocation && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleGetCurrentLocation}
            disabled={isRefreshing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40"
            title="Get current location weather"
            data-testid="button-floating-location"
          >
            <Navigation className="text-xl" />
          </Button>
        </div>
      )}
      
      {/* Settings Modal */}
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
