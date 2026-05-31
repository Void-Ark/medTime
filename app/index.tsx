import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { useAppTheme } from "@/providers/themeProvider";

export default function SplashScreen() {
  const { isDarkMode, theme } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const router = useRouter();
  
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#026e02" },
      ]}
      edges={["bottom"]}
    >
      <StatusBar hidden={true} />
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <FontAwesome6
          name="house-medical-circle-check"
          size={100}
          color={isDarkMode ? "#ffffffff" : "#00ff04ff"}
        />
        <Text style={[styles.appName, { color: isDarkMode ? "#ffffff" : "white" }]}>
          MedTime
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
  },
  appName: {
    textAlign: "center",
    fontSize: 32,
    marginTop: 10,
  },
});
