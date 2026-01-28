import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as LocalAuthentication from "expo-local-authentication";
import Foundation from "@expo/vector-icons/Foundation";
import { useRouter } from "expo-router";

const Auth = () => {
  // StatusBar.setHidden(true);
  const router = useRouter();
  const { height, width } = Dimensions.get("window");
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // const [hasStoredPin, setHasStoredPin] = useState(false);
  const [hasPin, setHasPin] = useState<boolean>(false); // Add this state

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Check biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);

      // Check for PIN (you should implement your PIN check logic here)
      // For demo, let's assume PIN exists if it's stored in secure storage
      const hasStoredPin = false; // Replace with your PIN check logic
      setHasPin(hasStoredPin);

      // If neither biometrics nor PIN is available, go to home
      // console.log(compatible, enrolled, hasPin);
      if (!hasBiometrics && !hasPin) {
        console.log("No authentication methods available");
        router.replace("/home");
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      // On error, navigate to home as fallback
      router.replace("/home");
    }
  };

  const handleAuthentication = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      if (hasBiometrics) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to access MedTime",
          fallbackLabel: "Use PIN",
        });

        if (result.success) {
          router.replace("/home");
        } else {
          setError("Authentication failed. Please try again.");
        }
      } else if (hasPin) {
        // Show PIN input
        console.log("Show PIN input");
      } else {
        // No authentication method available
        router.replace("/home");
      }
    } catch (err) {
      setError("Authentication error. Please try again.");
      console.error(err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#86f386", "#014901"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text>
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
        {/* <Text style={styles.statement}>Hey! It's medicines time.</Text> */}

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

          {error && (
            <View style={styles.errorContainer}>
              <Foundation name="alert" size={24} color="red" />
              <Text style={styles.errorText}>{error}</Text>
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
  },
  // statement: {
  //   color: "white",
  //
  //   fontSize: 22,
  // },
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

    marginBottom: 10,
  },
  text: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
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
    fontWeight: "600",
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
  },
});
