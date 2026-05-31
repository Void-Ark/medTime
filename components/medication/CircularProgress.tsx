import { useEffect, useRef } from "react";
import { Animated, Dimensions, View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  progress: number;
  totalDoses: number;
  completedDoses: number;
}

const { width } = Dimensions.get("screen");
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgress({
  progress,
  totalDoses,
  completedDoses,
}: CircularProgressProps) {
  const animationValue = useRef(new Animated.Value(0)).current;
  const validatedProgress =
    typeof progress === "number" && !isNaN(progress)
      ? Math.min(100, Math.max(0, progress))
      : 0;
  const size = width * 0.55;
  const strokeWidth = 15;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: validatedProgress / 100,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [validatedProgress]);

  const strokeDashoffset = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 40,
      }}
    >
      <View style={{ position: "relative" }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 32, color: "white" }}>
            {Math.round(progress)}%
          </Text>
          <Text style={{ fontSize: 16, color: "white" }}>
            {completedDoses}/{totalDoses} doses
          </Text>
        </View>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            rotation={90}
            originX={size / 2}
            originY={size / 2}
            stroke="#67fc67"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap={"round"}
          />
        </Svg>
      </View>
    </View>
  );
}
