import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Location } from "@shared/schema";
import { weatherApi } from "@/lib/weather-api";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["/api/locations/search", query],
    queryFn: () => weatherApi.searchLocations(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    setShowDropdown(value.length >= 2);
  };

  const handleLocationClick = (location: Location) => {
    setQuery(location.name);
    setShowDropdown(false);
    onLocationSelect(location);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || locations.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < locations.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && locations[selectedIndex]) {
          handleLocationClick(locations[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by city or ZIP code..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          className="pl-10 pr-4"
          data-testid="input-location-search"
        />
      </div>

      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg autocomplete-dropdown z-50"
          data-testid="dropdown-location-suggestions"
        >
          <div className="py-1">
            {isLoading && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            
            {!isLoading && locations.length === 0 && query.length >= 2 && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No locations found
              </div>
            )}
            
            {locations.map((location, index) => (
              <div
                key={location.id}
                className={cn(
                  "px-4 py-2 hover:bg-muted cursor-pointer flex items-center space-x-2 transition-colors",
                  selectedIndex === index && "bg-muted"
                )}
                onClick={() => handleLocationClick(location)}
                data-testid={`location-option-${index}`}
              >
                {location.zipCode ? (
                  <Hash className="text-muted-foreground text-sm" />
                ) : (
                  <MapPin className="text-muted-foreground text-sm" />
                )}
                <span className="text-sm">
                  {location.name}
                  {location.state && `, ${location.state}`}
                  {location.country && `, ${location.country}`}
                  {location.zipCode && ` - ${location.zipCode}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
