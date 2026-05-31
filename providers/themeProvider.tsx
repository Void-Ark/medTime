import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  theme: {
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;
    primary: string;
    secondary: string;
    cardBorder: string;
    danger: string;
    dangerBg: string;
    inputBg: string;
    inputBorder: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme_mode");
        setIsDarkMode(storedTheme === "dark");
      } catch (error) {
        console.error("Error loading theme settings:", error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem("theme_mode", newValue ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme settings:", error);
    }
  };

  const theme = {
    background: isDarkMode ? "#121212" : "#f5f5f5",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#ffffff" : "#333333",
    subText: isDarkMode ? "#b0bec5" : "#666666",
    border: isDarkMode ? "#37474f" : "#cccccc",
    primary: "#026e02",
    secondary: "#67fc67",
    cardBorder: isDarkMode ? "#333333" : "transparent",
    danger: "#c62828",
    dangerBg: isDarkMode ? "#2d1c1c" : "#ffebee",
    inputBg: isDarkMode ? "#2e2e2e" : "#ffffff",
    inputBorder: isDarkMode ? "#444444" : "#cccccc",
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};
