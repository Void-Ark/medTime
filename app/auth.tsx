import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Foundation from "@expo/vector-icons/Foundation";
import { useRouter } from "expo-router";
import { useBiometrics } from "@/hooks/useBiometrics";
import { useAppTheme } from "@/providers/themeProvider";

const Auth = () => {
  const router = useRouter();
  const { isDarkMode, theme } = useAppTheme();
  const { height, width } = Dimensions.get("window");
  const {
    hasBiometrics,
    isAuthenticating,
    authError,
    authenticate,
  } = useBiometrics();

  const handleAuthentication = () => {
    authenticate(() => {
      router.replace("/home");
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#86f386" }]} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={isDarkMode ? ["#37474f", "#121212"] : ["#86f386", "#014901"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={{ fontFamily: "ComicRegular", color: "white", opacity: 0.6 }}>
          Height: {height} | Width: {width}.
        </Text>
        <View style={styles.iconWrapper}>
          <FontAwesome6
            name="house-medical-circle-check"
            size={100}
            color="#ffffff"
          />
        </View>
        <Text style={styles.heading}>MedTime</Text>

        <View style={styles.box}>
          <Text style={styles.welcome}>Welcome Back!</Text>
          <Text style={styles.text}>
            {hasBiometrics
              ? "Use Face ID/Touch ID or pin to access your medication"
              : "Enter PIN to access your medication"}
          </Text>
          <Pressable
            onPress={handleAuthentication}
            style={({ pressed }) => [
              styles.pressable,
              pressed && styles.pressablePressed,
            ]}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                {hasBiometrics ? (
                  <Ionicons name="finger-print-sharp" size={24} color="white" />
                ) : (
                  <MaterialIcons name="password" size={24} color="white" />
                )}
                <Text style={styles.buttonText}>
                  {isAuthenticating
                    ? "Authenticating..."
                    : hasBiometrics
                    ? "Authenticate"
                    : "Enter PIN"}
                </Text>
              </>
            )}
          </Pressable>

          {authError && (
            <View style={styles.errorContainer}>
              <Foundation name="alert" size={24} color="red" />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Auth;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#86f386",
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  iconWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  heading: {
    color: "white",
    fontSize: 45,
    fontFamily: "ComicBold",
  },
  box: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    marginTop: 40,
    alignItems: "center",
  },
  welcome: {
    fontSize: 28,
    color: "white",
    fontFamily: "ComicBold",
    marginBottom: 10,
  },
  text: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
    fontFamily: "ComicRegular",
  },
  pressable: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "ComicBold",
  },
  pressablePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontFamily: "ComicRegular",
  },
});
