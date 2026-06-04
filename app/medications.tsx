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
import React, { useCallback, useState } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Medicine } from "@/schemas";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";
import { getHistory } from "@/storage/history";
import { isMedicineScheduleEnded } from "@/utils/medicineUtils";

const Medications = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, theme } = useAppTheme();
  const { fontSize, touchTarget, iconSize } = useAccessibility();
  const { medicines, removeMed, refresh } = useMedicines();
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const loadAllData = async () => {
    try {
      await refresh();
      const logs = await getHistory();
      setHistoryLogs(logs);
    } catch (err) {
      console.error("Error loading medications list history:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
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
    const isEnded = isMedicineScheduleEnded(item, historyLogs);
    return (
      <View style={[styles.medCard, { backgroundColor: theme.card, borderColor: isEnded ? (isDarkMode ? "#37474f" : "#ddd") : theme.cardBorder, borderWidth: isDarkMode ? 1 : (isEnded ? 1 : 0), opacity: isEnded ? 0.7 : 1.0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Medication Icon or Picture */}
          <View style={[styles.medIconContainer, { backgroundColor: isDarkMode ? "#2e2e2e" : "#f1fdf1", width: fontSize("lg") * 2.5, height: fontSize("lg") * 2.5, borderRadius: (fontSize("lg") * 2.5) / 2 }]}>
            {isEnded && (
              <View style={styles.endedOverlay}>
                <FontAwesome6 name="circle-check" size={fontSize("xs")} color="white" />
              </View>
            )}
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
                size={fontSize("lg")}
                color={isDarkMode ? "#80cbc4" : "#026e02"}
              />
            )}
          </View>

          {/* Details */}
          <View style={styles.medInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={[styles.medName, { color: theme.text, fontSize: fontSize("md") }]} numberOfLines={1}>
                {item.name}
              </Text>
              {isEnded && (
                <View style={[styles.endedBadge, { backgroundColor: isDarkMode ? "#2e2e2e" : "#f5f5f5", borderColor: isDarkMode ? "#455a64" : "#bbb" }]}>
                  <Text style={[styles.endedBadgeText, { color: isDarkMode ? "#90a4ae" : "#777", fontSize: fontSize("xs") - 2 }]}>Ended</Text>
                </View>
              )}
            </View>
            <Text style={[styles.medDetails, { color: theme.subText, fontSize: fontSize("sm") }]}>
              {item.dosage} • {item.frequency}x daily
            </Text>
            <Text style={[styles.scheduleText, { color: theme.subText, fontSize: fontSize("xs") }]} numberOfLines={1}>
              <FontAwesome6 name="calendar-days" size={fontSize("xs")} color={isDarkMode ? "#b0bec5" : "#666"} />{" "}
              {getScheduleText(item)}
            </Text>
          </View>
        </View>

        {/* Stock & Timing Info */}
        <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
          <View style={[styles.stockBadge, { backgroundColor: isDarkMode ? "#1b301c" : "#eafcea" }]}>
            <Text style={[styles.stockText, { color: isDarkMode ? "#81c784" : "#026e02", fontSize: fontSize("xs") }]}>
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
                  paddingVertical: touchTarget("paddingV") / 2,
                  paddingHorizontal: touchTarget("paddingH") / 1.5,
                  minHeight: touchTarget("minHeight") * 0.8,
                  justifyContent: "center",
                },
              ]}
              onPress={() => router.push(`/add?id=${item.id}`)}
            >
              <FontAwesome6 name="pen" size={fontSize("xs")} color={isDarkMode ? "#81c784" : "#026e02"} />
              <Text style={[styles.editBtnText, { color: isDarkMode ? "#81c784" : "#026e02", fontSize: fontSize("xs") }]}>Edit</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionBtn,
                styles.deleteBtn,
                {
                  backgroundColor: isDarkMode ? "#2d1c1c" : "#ffebee",
                  borderColor: isDarkMode ? "#4b2222" : "#ffcdd2",
                  paddingVertical: touchTarget("paddingV") / 2,
                  paddingHorizontal: touchTarget("paddingH") / 1.5,
                  minHeight: touchTarget("minHeight") * 0.8,
                  justifyContent: "center",
                },
              ]}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <FontAwesome6 name="trash-can" size={fontSize("xs")} color={isDarkMode ? "#ff8a80" : "#c62828"} />
              <Text style={[styles.deleteBtnText, { color: isDarkMode ? "#ff8a80" : "#c62828", fontSize: fontSize("xs") }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Show ALL medicines in management view (including ended ones) so user can edit/delete them.
  // Only truly archived medicines are hidden since they are intentionally soft-deleted.
  const visibleMedicines = medicines.filter((m) => !m.isArchived);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]}>
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Entypo name="chevron-left" size={fontSize("xl") * 1.2} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontSize: fontSize("xl") }]}>My Medications</Text>
          <Pressable onPress={() => router.push("/add")} style={{ minHeight: touchTarget("minHeight") / 1.2, justifyContent: "center" }}>
            <Entypo name="plus" size={fontSize("xl") * 1.2} color="#ffffff" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* List Body */}
      {visibleMedicines.length > 0 ? (
        <FlatList
          data={visibleMedicines}
          keyExtractor={(item: Medicine) => item.id}
          renderItem={renderMedItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="prescription-bottle" size={iconSize("hero")} color={isDarkMode ? "#00796b" : "#a5daa5"} />
          <Text style={[styles.emptyText, { color: theme.text, fontSize: fontSize("md") }]}>No medications added yet.</Text>
          <Pressable
            style={[styles.addMedBtn, { minHeight: touchTarget("minHeight"), paddingVertical: touchTarget("paddingV"), paddingHorizontal: touchTarget("paddingH"), justifyContent: "center", alignItems: "center" }]}
            onPress={() => router.push("/add")}
          >
            <Text style={[styles.addMedBtnText, { fontSize: fontSize("md") }]}>Add Medication</Text>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "white",
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
    fontFamily: "ComicBold",
  },
  medDetails: {
    marginTop: 2,
  },
  scheduleText: {
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
    fontFamily: "ComicBold",
  },
  endedOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#546e7a",
    borderRadius: 7,
    padding: 2,
    zIndex: 1,
  },
  endedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  endedBadgeText: {
    fontFamily: "ComicBold",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  editBtn: {},
  editBtnText: {
    fontFamily: "ComicBold",
  },
  deleteBtn: {},
  deleteBtnText: {
    fontFamily: "ComicBold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 15,
    fontFamily: "ComicBold",
  },
  addMedBtn: {
    backgroundColor: "#026e02",
    borderRadius: 12,
    marginTop: 20,
  },
  addMedBtnText: {
    color: "white",
    fontFamily: "ComicBold",
  },
});
