import { SplashScreen, Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { overrideTextDefaultFont } from "@/providers/fontProvider";
import { ThemeProvider } from "@/providers/themeProvider";
import * as Notifications from "expo-notifications";

export default function Layout() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    ComicRegular: require("../assets/fonts/ComicRelief-Regular.ttf"),
    ComicBold: require("../assets/fonts/ComicRelief-Bold.ttf"),
  });

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
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data && data.medicineId) {
          router.push("/calendar");
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
  );
}
