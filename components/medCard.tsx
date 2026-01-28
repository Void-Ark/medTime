import React from "react";
import { View, Text, StyleSheet } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export interface MedCardProps {
  medicine_name: string;
  quantity: string;
  time: Date;
  taken: boolean;
}

export default function MedCard({
  medicine_name,
  quantity,
  time,
  taken,
}: MedCardProps) {
  const color = taken ? "#c5ffc5" : "#ffbcbc";

  return (
    <View
      style={{
        backgroundColor: color,
        padding: 8,
        borderRadius: 10,
        marginVertical: 5,
        marginHorizontal: 5,
        shadowColor: "#000",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderColor: taken ? "transparent" : "red",
        borderWidth: 2,
      }}
    >
      {/* Left side: Icon + text */}
      <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
        <View
          style={{
            backgroundColor: "white",
            width: 46,
            height: 46,
            borderRadius: 23,
            justifyContent: "center",
            alignItems: "center",
            margin: 5,
          }}
        >
          {iconSelector(quantity, taken)}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            ellipsizeMode="tail" // add ... if too long
            style={{
              fontSize: 16,
              color: "black",
              fontWeight: "600",
            }}
          >
            {medicine_name}
          </Text>
          <Text style={{ fontSize: 14, color: "black" }}>{quantity}</Text>
        </View>
      </View>

      {/* Right side: Status + time */}
      <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
        <Text
          style={{
            color: !taken ? "red" : "green",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {taken ? "Taken" : "Not Taken"}
        </Text>
        <Text style={{ fontSize: 14, color: "#333" }}>
          {time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

function iconSelector(quantity: string, taken: boolean) {
  const color = taken ? "green" : "red";

  const styles = StyleSheet.create({
    icon: {
      // padding: 12,
      // backgroundColor: "#a53838",
      // alignItems: "center",
      // borderRadius: 30,
      // margin: 5,
      // justifyContent: "center",
      // resizeMode: "contain",
    },
  });

  if (quantity.toLowerCase().includes("tablet"))
    return (
      <FontAwesome5
        name="tablets"
        size={24}
        color={color}
        style={styles.icon}
      />
    );
  else if (quantity.toLowerCase().includes("capsule"))
    return (
      <FontAwesome5
        name="capsules"
        size={24}
        color={color}
        style={styles.icon}
      />
    );
  else if (quantity.toLowerCase().includes("injection"))
    return (
      <FontAwesome5
        name="syringe"
        size={24}
        color={color}
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
        size={24}
        color={color}
        style={styles.icon}
      />
    );
  else
    return (
      <MaterialIcons
        name="medication"
        size={24}
        color={color}
        style={styles.icon}
      />
    );
}
