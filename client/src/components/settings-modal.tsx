import React, { useState } from "react";
import { useSettings } from "@/contexts/settings-context";
import { useTheme } from "@/contexts/theme-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Thermometer,
  Palette,
  Bell,
  RefreshCw,
  MapPin,
  RotateCcw,
  Save,
} from "lucide-react";
import { UserSettings, TemperatureUnit, Theme, RefreshInterval } from "@shared/schema";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  // Update local settings when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    
    // Apply theme immediately
    if (localSettings.theme !== settings.theme) {
      setTheme(localSettings.theme);
    }

    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onOpenChange(false);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
  };

  const updateLocalSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Weather App Settings</span>
          </DialogTitle>
          <DialogDescription>
            Customize your weather app experience. Changes are saved immediately when you click Save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Temperature Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-primary" />
                <span>Temperature</span>
              </CardTitle>
              <CardDescription>
                Choose your preferred temperature unit for all weather displays.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="temperature-unit">Temperature Unit</Label>
                <Select
                  value={localSettings.temperatureUnit}
                  onValueChange={(value: TemperatureUnit) =>
                    updateLocalSetting("temperatureUnit", value)
                  }
                >
                  <SelectTrigger data-testid="select-temperature-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Choose your preferred theme for the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value: Theme) => updateLocalSetting("theme", value)}
                >
                  <SelectTrigger data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  System theme will automatically match your device's preference.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Control how you receive weather alerts and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for severe weather conditions and updates.
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={localSettings.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("notificationsEnabled", checked)
                  }
                  data-testid="switch-notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto-refresh Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <span>Auto-refresh</span>
              </CardTitle>
              <CardDescription>
                Set how often weather data should be automatically updated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="refresh-interval">Refresh Interval</Label>
                <Select
                  value={localSettings.autoRefreshInterval.toString()}
                  onValueChange={(value) =>
                    updateLocalSetting("autoRefreshInterval", Number(value) as RefreshInterval)
                  }
                >
                  <SelectTrigger data-testid="select-refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every 60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Location</span>
              </CardTitle>
              <CardDescription>
                Configure how the app determines your location for weather data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-location">Auto-detect Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically use your current location when the app opens.
                  </p>
                </div>
                <Switch
                  id="auto-location"
                  checked={localSettings.autoDetectLocation}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("autoDetectLocation", checked)
                  }
                  data-testid="switch-auto-location"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center space-x-2"
            data-testid="button-reset-settings"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-settings">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}