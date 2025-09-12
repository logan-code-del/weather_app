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
        // Use RainViewer API with proper time format - get latest available frame
        const currentTime = Math.floor(Date.now() / 1000);
        const roundedTime = Math.floor(currentTime / 600) * 600; // Round to 10 minute intervals
        
        radarLayer = L.tileLayer(
          `https://tilecache.rainviewer.com/v2/radar/${roundedTime}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            attribution: '© RainViewer.com',
            opacity: 0.6,
            maxZoom: 14,
            tms: false,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            crossOrigin: true
          }
        );
        break;
      
      case "clouds":
        // Use NOAA/NWS radar which is free and reliable
        radarLayer = L.tileLayer(
          'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
          {
            attribution: '© Iowa State University',
            opacity: 0.6,
            maxZoom: 12,
            tms: false,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            crossOrigin: true
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
    { key: "precipitation" as const, label: "Precipitation Radar", icon: CloudRain, color: "text-blue-600" },
    { key: "clouds" as const, label: "Weather Radar", icon: Cloud, color: "text-gray-600" },
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
                  RainViewer Live Data
                </div>
              </div>
            )}
            {activeLayer === "clouds" && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-300 rounded border"></div>
                  <span className="text-muted-foreground">Light Reflectivity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span className="text-muted-foreground">Moderate Reflectivity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-muted-foreground">Heavy Reflectivity</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2 italic">
                  NOAA/NWS Radar Data
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