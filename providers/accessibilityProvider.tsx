import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AccessibilityContextType {
  seniorModeEnabled: boolean;
  toggleSeniorMode: () => Promise<void>;
  loudAlarmsEnabled: boolean;
  toggleLoudAlarms: () => Promise<void>;
  fontSize: (size: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "hero") => number;
  touchTarget: (target: "minHeight" | "paddingV" | "paddingH") => number;
  iconSize: (size: "sm" | "md" | "lg" | "hero") => number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [seniorModeEnabled, setSeniorModeEnabled] = useState<boolean>(true);
  const [loudAlarmsEnabled, setLoudAlarmsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSenior = await AsyncStorage.getItem("senior_mode_enabled");
        const storedLoud = await AsyncStorage.getItem("loud_alarms_enabled");

        // Default to true for both if not set yet (highly user-friendly for seniors out of the box)
        setSeniorModeEnabled(storedSenior !== "false");
        setLoudAlarmsEnabled(storedLoud !== "false");
      } catch (error) {
        console.error("Error loading accessibility settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const toggleSeniorMode = async () => {
    try {
      const newValue = !seniorModeEnabled;
      setSeniorModeEnabled(newValue);
      await AsyncStorage.setItem("senior_mode_enabled", newValue ? "true" : "false");
    } catch (error) {
      console.error("Error saving senior mode settings:", error);
    }
  };

  const toggleLoudAlarms = async () => {
    try {
      const newValue = !loudAlarmsEnabled;
      setLoudAlarmsEnabled(newValue);
      await AsyncStorage.setItem("loud_alarms_enabled", newValue ? "true" : "false");
    } catch (error) {
      console.error("Error saving loud alarms settings:", error);
    }
  };

  // Helper functions returning font sizes, touch targets and icon dimensions
  const fontSize = (size: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "hero"): number => {
    if (seniorModeEnabled) {
      return {
        xs: 14,
        sm: 17,
        md: 19,
        lg: 21,
        xl: 24,
        xxl: 28,
        hero: 32,
      }[size];
    }
    return {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      hero: 28,
    }[size];
  };

  const touchTarget = (target: "minHeight" | "paddingV" | "paddingH"): number => {
    if (seniorModeEnabled) {
      return {
        minHeight: 56,
        paddingV: 16,
        paddingH: 22,
      }[target];
    }
    return {
      minHeight: 44,
      paddingV: 10,
      paddingH: 14,
    }[target];
  };

  const iconSize = (size: "sm" | "md" | "lg" | "hero"): number => {
    if (seniorModeEnabled) {
      return {
        sm: 24,
        md: 32,
        lg: 40,
        hero: 100,
      }[size];
    }
    return {
      sm: 20,
      md: 24,
      lg: 30,
      hero: 80,
    }[size];
  };

  if (loading) {
    return null; // Skip rendering layout structure until initial settings are resolved
  }

  return (
    <AccessibilityContext.Provider
      value={{
        seniorModeEnabled,
        toggleSeniorMode,
        loudAlarmsEnabled,
        toggleLoudAlarms,
        fontSize,
        touchTarget,
        iconSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};
