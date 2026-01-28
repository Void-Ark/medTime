// app/_layout.tsx
import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
// import { overrideTextDefaultFont } from "../providers/FontProvider";
import { overrideTextDefaultFont } from "../providers/fontProvider";
export default function Layout() {
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

  if (!fontsLoaded) {
    console.log("font not loaded");
    return null; // keep splash visible until fonts are ready
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="home" />
      <Stack.Screen name="add" />
    </Stack>
  );
}

// // app/_layout.tsx
// import { Tabs } from "expo-router";

// export default function Layout() {
//   return (
//     <Tabs>
//       <Tabs.Screen name="index" />
//       <Tabs.Screen name="auth" />
//       {/* <Tabs.Screen name="medicines" options={{ title: "Medicines" }} />
//       <Tabs.Screen name="reminders" options={{ title: "Reminders" }} />
//       <Tabs.Screen name="profile" options={{ title: "Profile" }} /> */}
//     </Tabs>
//   );
// }
