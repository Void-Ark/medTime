import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
} from "react-native";
import React, { useCallback } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Medicine } from "@/schemas";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/providers/themeProvider";

const Medications = () => {
  const router = useRouter();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : useSafeAreaInsets().top;

  const { isDarkMode, theme } = useAppTheme();
  const { medicines, removeMed, refresh } = useMedicines();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to delete ${name}? Past history logs for this medicine will not be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await removeMed(id);
            if (!success) {
              Alert.alert("Error", "Failed to delete medication.");
            }
          },
        },
      ]
    );
  };

  const getScheduleText = (med: Medicine) => {
    const patternType = med.patternType || "daily";
    if (patternType === "daily") return "Every Single Day";
    if (patternType === "asNeeded") return "Only As Needed (PRN)";
    if (patternType === "yearly") {
      const start = new Date(med.startDate);
      const dateStr = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `Every Year on ${dateStr}`;
    }
    if (patternType === "weekly" && med.pattern) {
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days = med.pattern.map((d) => weekdays[d]);
      return `Weekly on: ${days.join(", ")}`;
    }
    if (patternType === "monthly" && med.pattern) {
      return `Monthly on the ${med.pattern[0]}th`;
    }
    return "Custom Schedule";
  };

  const renderMedItem = ({ item }: { item: Medicine }) => {
    return (
      <View style={[styles.medCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Medication Icon or Picture */}
          <View style={[styles.medIconContainer, { backgroundColor: isDarkMode ? "#2e2e2e" : "#f1fdf1" }]}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.medImage} />
            ) : (
              <FontAwesome6
                name={
                  item.type === "pill"
                    ? "pills"
                    : item.type === "liquid"
                    ? "bottle-water"
                    : item.type === "injection"
                    ? "syringe"
                    : "prescription-bottle"
                }
                size={24}
                color={isDarkMode ? "#80cbc4" : "#026e02"}
              />
            )}
          </View>

          {/* Details */}
          <View style={styles.medInfo}>
            <Text style={[styles.medName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.medDetails, { color: theme.subText }]}>
              {item.dosage} • {item.frequency}x daily
            </Text>
            <Text style={[styles.scheduleText, { color: theme.subText }]} numberOfLines={1}>
              <FontAwesome6 name="calendar-days" size={12} color={isDarkMode ? "#b0bec5" : "#666"} />{" "}
              {getScheduleText(item)}
            </Text>
          </View>
        </View>

        {/* Stock & Timing Info */}
        <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
          <View style={[styles.stockBadge, { backgroundColor: isDarkMode ? "#1b301c" : "#eafcea" }]}>
            <Text style={[styles.stockText, { color: isDarkMode ? "#81c784" : "#026e02" }]}>
              {item.stockCount} doses available
            </Text>
          </View>

          {/* Edit / Delete Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={[
                styles.actionBtn,
                styles.editBtn,
                {
                  backgroundColor: isDarkMode ? "#122513" : "#f1fdf1",
                  borderColor: isDarkMode ? "#254627" : "#a5daa5",
                },
              ]}
              onPress={() => router.push(`/add?id=${item.id}`)}
            >
              <FontAwesome6 name="pen" size={14} color={isDarkMode ? "#81c784" : "#026e02"} />
              <Text style={[styles.editBtnText, { color: isDarkMode ? "#81c784" : "#026e02" }]}>Edit</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionBtn,
                styles.deleteBtn,
                {
                  backgroundColor: isDarkMode ? "#2d1c1c" : "#ffebee",
                  borderColor: isDarkMode ? "#4b2222" : "#ffcdd2",
                },
              ]}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <FontAwesome6 name="trash-can" size={14} color={isDarkMode ? "#ff8a80" : "#c62828"} />
              <Text style={[styles.deleteBtnText, { color: isDarkMode ? "#ff8a80" : "#c62828" }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]}>
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Entypo name="chevron-left" size={32} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>My Medications</Text>
          <Pressable onPress={() => router.push("/add")}>
            <Entypo name="plus" size={32} color="#ffffff" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* List Body */}
      {medicines.length > 0 ? (
        <FlatList
          data={medicines}
          keyExtractor={(item: Medicine) => item.id}
          renderItem={renderMedItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="prescription-bottle" size={80} color={isDarkMode ? "#00796b" : "#a5daa5"} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No medications added yet.</Text>
          <Pressable
            style={styles.addMedBtn}
            onPress={() => router.push("/add")}
          >
            <Text style={styles.addMedBtnText}>Add Medication</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Medications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontFamily: "ComicBold",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  medCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    overflow: "hidden",
  },
  medImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontFamily: "ComicBold",
  },
  medDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  scheduleText: {
    fontSize: 12,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    fontFamily: "ComicBold",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  editBtn: {},
  editBtnText: {
    fontSize: 12,
    fontFamily: "ComicBold",
  },
  deleteBtn: {},
  deleteBtnText: {
    fontSize: 12,
    fontFamily: "ComicBold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
    fontFamily: "ComicBold",
  },
  addMedBtn: {
    backgroundColor: "#026e02",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 20,
  },
  addMedBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "ComicBold",
  },
});
