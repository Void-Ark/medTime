import { SplashScreen, Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { overrideTextDefaultFont } from "@/providers/fontProvider";
import { ThemeProvider } from "@/providers/themeProvider";
import { AccessibilityProvider } from "@/providers/accessibilityProvider";
import * as Notifications from "expo-notifications";
import { migrateFromAsyncStorage } from "@/storage/db";

export default function Layout() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    ComicRegular: require("../assets/fonts/ComicRelief-Regular.ttf"),
    ComicBold: require("../assets/fonts/ComicRelief-Bold.ttf"),
  });

  useEffect(() => {
    // Run database migration helper from AsyncStorage
    migrateFromAsyncStorage();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      overrideTextDefaultFont("ComicBold");
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Listen for notification interactions (e.g. lockscreeen clicks)
    let subscription: any;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
        const data = response.notification.request.content.data;
        const actionIdentifier = response.actionIdentifier;
        if (data && data.medicineId) {
          const { markAsTaken, snoozeMedicine } = require("@/storage/medicines");
          if (actionIdentifier === "take") {
            try {
              await markAsTaken(data.medicineId);
              router.replace("/home");
            } catch (err) {
              console.error("Failed to mark as taken from notification:", err);
            }
          } else if (actionIdentifier === "snooze-15") {
            try {
              await snoozeMedicine(data.medicineId, 15);
              router.replace("/home");
            } catch (err) {
              console.error("Failed to snooze from notification:", err);
            }
          } else {
            router.push("/calendar");
          }
        }
      });
    } catch (err) {
      console.warn("Notifications listener could not be registered:", err);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null; // keep splash visible until fonts are ready
  }

  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="home" />
          <Stack.Screen name="add" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="medications" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="history" />
        </Stack>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}

