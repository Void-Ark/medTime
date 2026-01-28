import { Text, StyleSheet, Pressable, Animated } from "react-native";
import React, { useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

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

  return (
    <Pressable
      onPress={() => {
        console.log("Pressed:", label);
        router.push(route);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={gradient}
          style={{
            padding: 10,
            borderRadius: 20,
            alignItems: "flex-start",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          {icons[icon as keyof typeof icons]}
          <Text style={{ color: color, fontSize: 16 }}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  icon: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 50,
    marginBottom: 5,
  },
});

const icons = {
  add_medication: (
    <MaterialIcons
      name="assignment-add"
      size={24}
      color="white"
      style={styles.icon}
    />
  ),
  calander: (
    <FontAwesome
      name="calendar-check-o"
      size={24}
      color="white"
      style={styles.icon}
    />
  ),
  history: (
    <FontAwesome name="history" size={24} color="white" style={styles.icon} />
  ),
  refill_tracker: (
    <Ionicons name="bag-check" size={24} color="white" style={styles.icon} />
  ),
};
