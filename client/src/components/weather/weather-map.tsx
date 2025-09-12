import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Map, CloudRain, Cloud, Crosshair, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { Location } from "@shared/schema";

type MapLayer = "precipitation" | "clouds";

interface WeatherMapProps {
  location?: Location;
  className?: string;
}

// Custom hook to handle map centering and radar layers
function RadarMapController({ 
  location, 
  activeLayer, 
  onLocationChange 
}: { 
  location?: Location;
  activeLayer: MapLayer;
  onLocationChange?: (lat: number, lon: number) => void;
}) {
  const map = useMap();
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lon], 8);
    }
  }, [location, map]);

  useEffect(() => {
    // Add click handler for location updates
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onLocationChange]);

  useEffect(() => {
    // Remove existing radar layer safely
    if (radarLayerRef.current && map.hasLayer(radarLayerRef.current)) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    // Add new radar layer based on active layer
    let radarLayer: L.TileLayer | null = null;

    const addLayerSafely = (layer: L.TileLayer) => {
      try {
        if (map && layer) {
          layer.addTo(map);
          radarLayerRef.current = layer;
        }
      } catch (error) {
        console.error('Error adding layer:', error);
      }
    };

    switch (activeLayer) {
      case "precipitation":
        // Use RainViewer radar data which is more reliable
        radarLayer = L.tileLayer(
          'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png',
          {
            attribution: 'RainViewer.com',
            opacity: 0.6,
            maxZoom: 12,
            time: Math.floor(Date.now() / 600000) * 600000, // Round to nearest 10 minutes
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        );
        // Replace {time} in URL with actual timestamp
        const timeStamp = Math.floor(Date.now() / 600000) * 600000;
        radarLayer = L.tileLayer(
          `https://tilecache.rainviewer.com/v2/radar/${timeStamp}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            attribution: 'RainViewer.com',
            opacity: 0.6,
            maxZoom: 12,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        );
        break;
      
      case "clouds":
        // Use OpenWeatherMap clouds layer (free tier)
        radarLayer = L.tileLayer(
          'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=demo',
          {
            attribution: 'OpenWeatherMap',
            opacity: 0.5,
            maxZoom: 12,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        );
        break;
      
    }

    if (radarLayer) {
      addLayerSafely(radarLayer);
    }

    return () => {
      if (radarLayerRef.current && map.hasLayer(radarLayerRef.current)) {
        try {
          map.removeLayer(radarLayerRef.current);
        } catch (error) {
          console.error('Error removing layer:', error);
        }
        radarLayerRef.current = null;
      }
    };
  }, [activeLayer, map, location]);

  return null;
}

export default function WeatherMap({ location, className }: WeatherMapProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("precipitation");
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // US center
  const [mapKey, setMapKey] = useState(0); // Force re-render of map

  const mapLayers = [
    { key: "precipitation" as const, label: "Radar Reflectivity", icon: CloudRain, color: "text-blue-600" },
    { key: "clouds" as const, label: "Satellite Clouds", icon: Cloud, color: "text-gray-600" },
  ];

  useEffect(() => {
    if (location) {
      setMapCenter([location.lat, location.lon]);
      setMapKey(prev => prev + 1); // Force map re-render
    }
  }, [location]);

  const handleCenterMap = () => {
    if (location) {
      setMapCenter([location.lat, location.lon]);
      setMapKey(prev => prev + 1);
    }
  };

  const handleMapLocationChange = (lat: number, lon: number) => {
    // Could emit location change event here if needed
    console.log('Map clicked at:', lat, lon);
  };

  return (
    <Card className={cn("overflow-hidden", className)} data-testid="weather-map">
      <CardHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <Map className="text-primary mr-2" />
Weather Radar & Satellite
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCenterMap}
              disabled={!location}
              title="Center on current location"
              data-testid="button-center-map"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMapKey(prev => prev + 1)}
              title="Refresh radar"
              data-testid="button-refresh-radar"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-2 flex-wrap">
          {mapLayers.map(({ key, label, icon: Icon, color }) => (
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
              <Icon className={cn("h-3 w-3 mr-1", activeLayer === key ? "text-primary-foreground" : color)} />
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-96 relative" data-testid="map-container">
          <MapContainer
            key={mapKey}
            center={mapCenter}
            zoom={location ? 8 : 4}
            className="h-full w-full"
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <RadarMapController
              location={location}
              activeLayer={activeLayer}
              onLocationChange={handleMapLocationChange}
            />
          </MapContainer>
          
          {/* Map overlay controls */}
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg border z-[1000]">
            <div className="font-semibold mb-2 text-foreground">Legend</div>
            {activeLayer === "precipitation" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-200 rounded border"></div>
                  <span className="text-muted-foreground">Light Precipitation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-muted-foreground">Moderate Precipitation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-800 rounded"></div>
                  <span className="text-muted-foreground">Heavy Precipitation</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2 italic">
                  RainViewer Radar Data
                </div>
              </div>
            )}
            {activeLayer === "clouds" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-200 rounded border"></div>
                  <span className="text-muted-foreground">Clear Skies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span className="text-muted-foreground">Thin Clouds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-700 rounded"></div>
                  <span className="text-muted-foreground">Dense Clouds</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2 italic">
                  OpenWeatherMap Clouds
                </div>
              </div>
            )}
          </div>

          {/* Current location indicator */}
          {location && (
            <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg p-2 text-xs shadow-lg border z-[1000]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-muted-foreground font-medium">{location.name}</span>
              </div>
            </div>
          )}

          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs text-center z-[1000]">
            <p>
Weather radar & satellite data • Click and drag to explore • Use mouse wheel to zoom • Real-time weather imagery
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}