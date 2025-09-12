import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Map, Thermometer, CloudRain, Wind, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MapLayer = "temperature" | "precipitation" | "wind" | "clouds";

export default function WeatherMap() {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("temperature");

  const mapLayers = [
    { key: "temperature" as const, label: "Temperature", icon: Thermometer },
    { key: "precipitation" as const, label: "Precipitation", icon: CloudRain },
    { key: "wind" as const, label: "Wind", icon: Wind },
    { key: "clouds" as const, label: "Clouds", icon: Cloud },
  ];

  return (
    <Card className="overflow-hidden" data-testid="weather-map">
      <CardHeader className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Map className="text-primary mr-2" />
          Weather Map
        </h2>
        <div className="flex items-center space-x-2 mt-2">
          {mapLayers.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeLayer === key ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveLayer(key)}
              className={cn(
                "text-xs px-3 py-1",
                activeLayer === key 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              )}
              data-testid={`button-map-layer-${key}`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          className="h-96 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative"
          data-testid="map-container"
        >
          {/* Placeholder for interactive map */}
          <div className="text-center z-10">
            <Map className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
            <p className="text-muted-foreground font-medium">Interactive Weather Map</p>
            <p className="text-xs text-muted-foreground mt-2">
              Showing {mapLayers.find(l => l.key === activeLayer)?.label.toLowerCase()} data
            </p>
            <p className="text-xs text-muted-foreground">
              Click and drag to explore weather across the country
            </p>
          </div>
          
          {/* Map overlay indicators */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
            <div className="font-medium mb-1">Legend</div>
            {activeLayer === "temperature" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Cold (&lt; 40°F)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Mild (40-70°F)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Hot (&gt; 70°F)</span>
                </div>
              </div>
            )}
            {activeLayer === "precipitation" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-200 rounded"></div>
                  <span>Light</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-700 rounded"></div>
                  <span>Heavy</span>
                </div>
              </div>
            )}
            {activeLayer === "wind" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-300 rounded"></div>
                  <span>Light (&lt; 15 mph)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span>Moderate (15-25 mph)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Strong (&gt; 25 mph)</span>
                </div>
              </div>
            )}
            {activeLayer === "clouds" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Clear</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>Partly Cloudy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-600 rounded"></div>
                  <span>Overcast</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Map loading overlay for future implementation */}
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
              Interactive map coming soon
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
