import { useEffect, useRef, useState } from "react";
import { WeatherAlert } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
import { AlertTriangle, Zap, Wind, Snowflake } from "lucide-react";

const NOTIFICATION_STORAGE_KEY = "weatherscope-shown-alerts";
const ALERT_CHECK_INTERVAL = 60000; // Check every minute

interface AlertNotificationState {
  shownAlertIds: Set<string>;
  lastCheck: number;
}

export function useAlertNotifications() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [notificationState, setNotificationState] = useState<AlertNotificationState>({
    shownAlertIds: new Set(),
    lastCheck: Date.now()
  });
  const previousAlertsRef = useRef<WeatherAlert[]>([]);

  // Load shown alerts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotificationState(prev => ({
          ...prev,
          shownAlertIds: new Set(parsed.shownAlertIds || [])
        }));
      }
    } catch (error) {
      console.error("Failed to load notification state:", error);
    }
  }, []);

  // Save shown alerts to localStorage when state changes
  useEffect(() => {
    try {
      const toStore = {
        shownAlertIds: Array.from(notificationState.shownAlertIds),
        lastCheck: notificationState.lastCheck
      };
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error("Failed to save notification state:", error);
    }
  }, [notificationState]);

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return "🚨";
      case "moderate":
        return "⚠️";
      case "minor":
        return "❄️";
      default:
        return "⚠️";
    }
  };

  const getSeverityColor = (severity: string): "default" | "destructive" => {
    switch (severity.toLowerCase()) {
      case "severe":
        return "destructive";
      case "moderate":
      case "minor":
      default:
        return "default";
    }
  };

  const shouldNotifyForAlert = (alert: WeatherAlert): boolean => {
    // Don't notify if notifications are disabled
    if (!settings.notificationsEnabled) {
      return false;
    }

    // Don't notify if alert has ended
    if (new Date(alert.endTime) < new Date()) {
      return false;
    }

    // Don't notify if we've already shown this alert
    if (notificationState.shownAlertIds.has(alert.id)) {
      return false;
    }

    // Always notify for severe alerts
    if (alert.severity.toLowerCase() === "severe") {
      return true;
    }

    // Notify for moderate alerts that just started (within last hour)
    if (alert.severity.toLowerCase() === "moderate") {
      const alertStart = new Date(alert.startTime);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return alertStart > hourAgo;
    }

    // Don't notify for minor alerts by default
    return false;
  };

  const formatAlertDuration = (startTime: string | Date, endTime: string | Date): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start > now) {
      return `Starts ${start.toLocaleTimeString()}`;
    }

    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const showAlertNotification = (alert: WeatherAlert) => {
    const icon = getSeverityIcon(alert.severity);
    const variant = getSeverityColor(alert.severity);
    const duration = formatAlertDuration(alert.startTime, alert.endTime);

    toast({
      title: `${icon} Weather Alert: ${alert.title}`,
      description: `${alert.description.substring(0, 100)}... • ${duration}`,
      variant: variant,
      duration: alert.severity.toLowerCase() === "severe" ? 10000 : 5000,
    });

    // Mark this alert as shown
    setNotificationState(prev => ({
      ...prev,
      shownAlertIds: new Set([...Array.from(prev.shownAlertIds), alert.id]),
      lastCheck: Date.now()
    }));
  };

  const checkForNewAlerts = (currentAlerts: WeatherAlert[]) => {
    if (!settings.notificationsEnabled) {
      return;
    }

    const previousAlerts = previousAlertsRef.current;
    
    // Check for new alerts
    const newAlerts = currentAlerts.filter(alert => 
      !previousAlerts.some(prevAlert => prevAlert.id === alert.id) &&
      shouldNotifyForAlert(alert)
    );

    // Check for severity changes in existing alerts
    const severityChanges = currentAlerts.filter(alert => {
      const prevAlert = previousAlerts.find(p => p.id === alert.id);
      return prevAlert && 
             prevAlert.severity !== alert.severity && 
             shouldNotifyForAlert(alert);
    });

    // Show notifications for new alerts and severity changes
    [...newAlerts, ...severityChanges].forEach(alert => {
      showAlertNotification(alert);
    });

    // Update the reference
    previousAlertsRef.current = currentAlerts;
  };

  const clearExpiredAlerts = () => {
    const now = new Date();
    setNotificationState(prev => {
      const activeAlertIds = new Set<string>();
      
      // Keep only IDs of alerts that might still be active
      // We don't have endTime here, so we'll keep recent ones (last 24 hours)
      const dayAgo = now.getTime() - (24 * 60 * 60 * 1000);
      
      Array.from(prev.shownAlertIds).forEach(alertId => {
        // In a real implementation, we'd check against actual alert data
        // For now, we'll periodically clear old entries
        if (prev.lastCheck > dayAgo) {
          activeAlertIds.add(alertId);
        }
      });

      return {
        ...prev,
        shownAlertIds: activeAlertIds
      };
    });
  };

  // Periodically clean up expired alerts
  useEffect(() => {
    const cleanup = setInterval(clearExpiredAlerts, ALERT_CHECK_INTERVAL);
    return () => clearInterval(cleanup);
  }, []);

  const getActiveAlertCount = (alerts: WeatherAlert[]): number => {
    const now = new Date();
    return alerts.filter(alert => 
      new Date(alert.endTime) > now && 
      new Date(alert.startTime) <= now
    ).length;
  };

  const hasActiveAlerts = (alerts: WeatherAlert[]): boolean => {
    return getActiveAlertCount(alerts) > 0;
  };

  const getHighestSeverity = (alerts: WeatherAlert[]): string => {
    const now = new Date();
    const activeAlerts = alerts.filter(alert => 
      new Date(alert.endTime) > now && 
      new Date(alert.startTime) <= now
    );

    if (activeAlerts.some(alert => alert.severity.toLowerCase() === "severe")) {
      return "severe";
    }
    if (activeAlerts.some(alert => alert.severity.toLowerCase() === "moderate")) {
      return "moderate";
    }
    if (activeAlerts.length > 0) {
      return "minor";
    }
    return "none";
  };

  const resetNotificationState = () => {
    setNotificationState({
      shownAlertIds: new Set(),
      lastCheck: Date.now()
    });
    localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
  };

  return {
    checkForNewAlerts,
    hasActiveAlerts,
    getActiveAlertCount,
    getHighestSeverity,
    resetNotificationState,
    notificationState
  };
}