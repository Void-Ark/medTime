import { Text, StyleSheet, Pressable, Animated } from "react-native";
import React, { useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAccessibility } from "@/providers/accessibilityProvider";

export interface QuickActionBoxProps {
  icon: string;
  label: string;
  route: string;
  color: string;
  gradient: [string, string]; // [startColor, endColor]
}

export const QuickActionBox: React.FC<QuickActionBoxProps> = ({
  icon,
  label,
  route,
  color,
  gradient,
}) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { fontSize, touchTarget } = useAccessibility();

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95, // shrink a bit
      duration: 100, // quick
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1, // back to normal size
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const calculatedPadding = touchTarget("paddingV");

  return (
    <Pressable
      onPress={() => {
        console.log("Pressed:", label);
        router.push(route as any);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={gradient}
          style={{
            padding: calculatedPadding,
            borderRadius: 20,
            alignItems: "flex-start",
            justifyContent: "center",
            flexDirection: "column",
            minHeight: touchTarget("minHeight") * 2,
          }}
        >
          {renderIcon(icon, fontSize("lg"))}
          <Text style={{ color: color, fontSize: fontSize("sm"), fontFamily: "ComicBold", marginTop: 4 }}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const renderIcon = (key: string, size: number) => {
  const localStyles = StyleSheet.create({
    icon: {
      padding: 10,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 50,
      marginBottom: 5,
    },
  });

  switch (key) {
    case "add_medication":
      return (
        <MaterialIcons
          name="assignment-add"
          size={size}
          color="white"
          style={localStyles.icon}
        />
      );
    case "calander":
      return (
        <FontAwesome
          name="calendar-check-o"
          size={size}
          color="white"
          style={localStyles.icon}
        />
      );
    case "history":
      return (
        <FontAwesome
          name="history"
          size={size}
          color="white"
          style={localStyles.icon}
        />
      );
    case "refill_tracker":
      return (
        <Ionicons
          name="bag-check"
          size={size}
          color="white"
          style={localStyles.icon}
        />
      );
    case "medications":
      return (
        <MaterialIcons
          name="medical-services"
          size={size}
          color="white"
          style={localStyles.icon}
        />
      );
    case "settings":
      return (
        <MaterialIcons
          name="settings"
          size={size}
          color="white"
          style={localStyles.icon}
        />
      );
    default:
      return null;
  }
};

export default QuickActionBox;

