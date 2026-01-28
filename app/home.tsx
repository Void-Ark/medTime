import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import CircularProgress from "../components/circularProgress";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  QuickActionBox,
  QuickActionBoxProps,
} from "../components/quickActionBox";
import MedCard from "../components/medCard";
import { MED_CARD_DATA, QUICK_ACTIONS } from "../assets/data";

const { height, width } = Dimensions.get("screen");

// const QUICK_ACTIONS: QuickActionBoxProps[] = [
//   {
//     icon: "add_medication",
//     label: "Add\nMedication",
//     route: "/medications/add",
//     color: "white",
//     gradient: ["#00f7007c", "#009500"] as [string, string],
//   },
//   {
//     icon: "calander",
//     label: "Calander\nView",
//     route: "/calendar" as const,
//     color: "white",
//     gradient: ["#0059ff4b", "#0059ff"] as [string, string],
//   },
//   {
//     icon: "history",
//     label: "History\nLog",
//     route: "/history",
//     color: "white",
//     gradient: ["#fb00ff3b", "#a200a4"] as [string, string],
//   },
//   {
//     icon: "refill_tracker",
//     label: "Refill\nTracker",
//     route: "/refills",
//     color: "white",
//     gradient: ["#f9a60055", "#f9a600"] as [string, string],
//   },
// ];

const Home = () => {
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : useSafeAreaInsets().top;
  const [notificationCount, setNotificationCount] = React.useState(3); // Example count

  return (
    <ScrollView
      style={{ backgroundColor: "#f0f0f0", flex: 1 }}
      bounces={false}
      alwaysBounceVertical={false}
    >
      <LinearGradient colors={["#67fc67", "#026e02"]} style={styles.gradient}>
        <View style={{ height: statusBarHeight }}></View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Daily Progress</Text>
          <View style={styles.notificationContainer}>
            <MaterialIcons name="notifications-none" size={24} color="white" />
            {notificationCount > 0 && <View style={styles.dot} />}
          </View>
        </View>
        <CircularProgress progress={70} totalDoses={5} completedDoses={3} />
      </LinearGradient>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <View key={action.route} style={{ width: "48%", margin: "1%" }}>
              <QuickActionBox {...action} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <TodaysMedList />
      </View>
    </ScrollView>
  );
};

const TodaysMedList = () => {
  if (MED_CARD_DATA.length !== 0)
    return (
      <>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 18 }}>Today's Schedule</Text>
          <Text style={{ color: "green" }}>See All</Text>
        </View>
        {MED_CARD_DATA.map((action) => (
          <View key={action.medicine_name}>
            <MedCard {...action} />
          </View>
        ))}
      </>
    );
  else
    return (
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <FontAwesome6
          name="house-medical-circle-check"
          size={100}
          color="#a5daa5"
        />
        <Text
          style={{
            color: "#2f6f2f",
            fontSize: 16,
            marginTop: 10,
          }}
        >
          No medications scheduled for today.
        </Text>
        <View style={{ height: 100, backgroundColor: "red" }}></View>
      </View>
    );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: "relative",
  },
  dot: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#FF4444",
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "red",
  },
  gradient: {
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  quickActionsContainer: {
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  quickActionsTitle: {
    fontSize: 20,

    color: "#333",
    marginLeft: 10,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
});

export default Home;
