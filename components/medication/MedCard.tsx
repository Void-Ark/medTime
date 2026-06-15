import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";

export interface MedCardProps {
  medicine_name: string;
  quantity: string;
  time: Date;
  taken: boolean;
  imageUrl?: string;
  statusText?: "Taken" | "Locked" | "Take" | "Missed" | "Snoozed";
}

export default function MedCard({
  medicine_name,
  quantity,
  time,
  taken,
  imageUrl,
  statusText,
}: MedCardProps) {
  const { theme, isDarkMode } = useAppTheme();
  const { fontSize, touchTarget } = useAccessibility();
  const parsedTime = typeof time === "string" ? new Date(time) : time;

  // Compute status details based on taken prop and optional statusText context
  const currentStatus = taken ? "Taken" : (statusText || "Pending");

  let cardBg = theme.card;
  let cardBorder = theme.border;
  let statusColor = theme.subText;
  let iconColor = theme.subText;
  let displayStatus = "Not Taken";

  if (currentStatus === "Taken") {
    cardBg = isDarkMode ? "#152e1f" : "#e8f5e9";
    cardBorder = isDarkMode ? "#1e5e3a" : "#c8e6c9";
    statusColor = isDarkMode ? "#81c784" : "#2e7d32";
    iconColor = isDarkMode ? "#81c784" : "#2e7d32";
    displayStatus = "Taken";
  } else if (currentStatus === "Missed") {
    cardBg = isDarkMode ? "#2d1a1a" : "#ffebee";
    cardBorder = isDarkMode ? "#822727" : "#ffcdd2";
    statusColor = isDarkMode ? "#e57373" : "#c62828";
    iconColor = isDarkMode ? "#e57373" : "#c62828";
    displayStatus = "Missed";
  } else if (currentStatus === "Take") {
    cardBg = isDarkMode ? "#132535" : "#e3f2fd";
    cardBorder = isDarkMode ? "#1d4f7c" : "#90caf9";
    statusColor = isDarkMode ? "#64b5f6" : "#1565c0";
    iconColor = isDarkMode ? "#64b5f6" : "#1565c0";
    displayStatus = "Take Now";
  } else if (currentStatus === "Snoozed") {
    cardBg = isDarkMode ? "#2d2417" : "#fffde7";
    cardBorder = isDarkMode ? "#825e27" : "#fff59d";
    statusColor = isDarkMode ? "#ffb74d" : "#ef6c00";
    iconColor = isDarkMode ? "#ffb74d" : "#ef6c00";
    displayStatus = "Snoozed";
  } else if (currentStatus === "Locked") {
    cardBg = theme.card;
    cardBorder = theme.border;
    statusColor = theme.subText;
    iconColor = theme.subText;
    displayStatus = "Locked";
  } else {
    // Fallback/Pending
    cardBg = isDarkMode ? "#2d1a1a" : "#ffebee";
    cardBorder = isDarkMode ? "#822727" : "#ffcdd2";
    statusColor = isDarkMode ? "#e57373" : "#c62828";
    iconColor = isDarkMode ? "#e57373" : "#c62828";
    displayStatus = "Not Taken";
  }

  const calculatedMinHeight = touchTarget("minHeight") + 10;

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1.5,
        paddingHorizontal: touchTarget("paddingH") / 1.5,
        paddingVertical: touchTarget("paddingV") / 1.5,
        minHeight: calculatedMinHeight,
        borderRadius: 14,
        marginVertical: 6,
        marginHorizontal: 5,
        shadowColor: "#000",
        shadowOpacity: isDarkMode ? 0.2 : 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Left side: Icon + text */}
      <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
        <View
          style={{
            backgroundColor: isDarkMode ? "#2e2e2e" : "#ffffff",
            width: fontSize("lg") * 2.2,
            height: fontSize("lg") * 2.2,
            borderRadius: (fontSize("lg") * 2.2) / 2,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: isDarkMode ? "#444" : "#f0f0f0",
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%", resizeMode: "cover" }}
            />
          ) : (
            iconSelector(quantity, iconColor, fontSize("lg") * 1.1)
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            ellipsizeMode="tail" // add ... if too long
            numberOfLines={1}
            style={{
              fontSize: fontSize("md"),
              color: theme.text,
              fontFamily: "ComicBold",
            }}
          >
            {medicine_name}
          </Text>
          <Text style={{ fontSize: fontSize("xs"), color: theme.subText, fontFamily: "ComicRegular", marginTop: 2 }}>{quantity}</Text>
        </View>
      </View>

      {/* Right side: Status + time */}
      <View style={{ justifyContent: "center", alignItems: "flex-end", paddingLeft: 10 }}>
        <Text
          style={{
            color: statusColor,
            fontSize: fontSize("sm"),
            fontFamily: "ComicBold",
          }}
        >
          {displayStatus}
        </Text>
        <Text style={{ fontSize: fontSize("xs"), color: theme.subText, fontFamily: "ComicRegular", marginTop: 4 }}>
          {parsedTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

function iconSelector(quantity: string, iconColor: string, size: number) {
  const styles = StyleSheet.create({
    icon: {},
  });

  if (quantity.toLowerCase().includes("tablet"))
    return (
      <FontAwesome5
        name="tablets"
        size={size}
        color={iconColor}
        style={styles.icon}
      />
    );
  else if (quantity.toLowerCase().includes("capsule"))
    return (
      <FontAwesome5
        name="capsules"
        size={size}
        color={iconColor}
        style={styles.icon}
      />
    );
  else if (quantity.toLowerCase().includes("injection"))
    return (
      <FontAwesome5
        name="syringe"
        size={size}
        color={iconColor}
        style={styles.icon}
      />
    );
  else if (
    quantity.toLowerCase().includes("bottle") ||
    quantity.toLowerCase().includes("tonic") ||
    quantity.toLowerCase().includes("syrup")
  )
    return (
      <MaterialCommunityIcons
        name="bottle-tonic-plus"
        size={size}
        color={iconColor}
        style={styles.icon}
      />
    );
  else
    return (
      <MaterialIcons
        name="medication"
        size={size + 2}
        color={iconColor}
        style={styles.icon}
      />
    );
}

