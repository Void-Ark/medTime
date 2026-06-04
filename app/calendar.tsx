import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Medicine } from "@/schemas";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter, useFocusEffect } from "expo-router";
import { getHistory } from "@/storage/history";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";

export interface MedInstance {
  instanceId: string;
  medicine: Medicine;
  scheduledTime: Date;
  isTaken: boolean;
  canTake: boolean;
  statusText: "Taken" | "Locked" | "Take" | "Missed";
}

const Calendar = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, theme } = useAppTheme();
  const { fontSize, touchTarget, iconSize } = useAccessibility();

  const { medicines, takeMed, refresh } = useMedicines();
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredMeds, setFilteredMeds] = useState<MedInstance[]>([]);

  // Focus synchronization
  const loadAllData = async () => {
    try {
      await refresh();
      const logs = await getHistory();
      setHistoryLogs(logs);
    } catch (err) {
      console.error("Error loading calendar data:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  useEffect(() => {
    // 1. Filter active medicines for the selected date
    const dayFiltered = medicines.filter((med) => {
      if (med.isArchived) return false;
      const medStartDate = new Date(med.startDate);
      const dateZeroTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      const startZeroTime = new Date(
        medStartDate.getFullYear(),
        medStartDate.getMonth(),
        medStartDate.getDate()
      );

      if (dateZeroTime < startZeroTime) return false;

      if (med.endDate) {
        const medEndDate = new Date(med.endDate);
        const endZeroTime = new Date(
          medEndDate.getFullYear(),
          medEndDate.getMonth(),
          medEndDate.getDate()
        );
        if (dateZeroTime > endZeroTime) return false;
      }

      const patternType = med.patternType || "daily";

      if (patternType === "daily") {
        return true;
      }

      if (patternType === "weekly" && med.pattern) {
        const dayOfWeek = selectedDate.getDay(); // 0 = Sun, 1 = Mon, etc.
        return med.pattern.includes(dayOfWeek);
      }

      if (patternType === "monthly" && med.pattern) {
        const dayOfMonth = selectedDate.getDate();
        return med.pattern.includes(dayOfMonth);
      }

      if (patternType === "yearly") {
        const selectedMonth = selectedDate.getMonth();
        const selectedDay = selectedDate.getDate();
        const startMonth = medStartDate.getMonth();
        const startDay = medStartDate.getDate();
        return selectedMonth === startMonth && selectedDay === startDay;
      }

      if (patternType === "asNeeded") {
        return true;
      }

      return true;
    });

    // 2. Expand active medicines into distinct timing instances
    const instances: MedInstance[] = [];
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    dayFiltered.forEach((med) => {
      const timingsList = med.timings || [];
      timingsList.forEach((timing, timingIdx) => {
        const parsedTiming = typeof timing === "string" ? new Date(timing) : timing;
        
        // Construct the scheduled time on the selected date
        const scheduledTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          parsedTiming.getHours(),
          parsedTiming.getMinutes(),
          0
        );

        // Check if this timing instance was already taken
        const isInstanceTaken = historyLogs.some((log) => {
          if (log.medicineId !== med.id) return false;
          const logTime = new Date(log.takenAt);
          const diffMs = logTime.getTime() - scheduledTime.getTime();
          const windowMs = 60 * 60 * 1000; // 1 hour window
          return diffMs >= -windowMs && diffMs <= windowMs;
        });

        // Determine availability
        let canTake = false;
        let statusText: "Taken" | "Locked" | "Take" | "Missed" = "Take";

        if (isInstanceTaken) {
          statusText = "Taken";
        } else if (isToday) {
          // If date is today, check active window (T - 1h to T + 1h)
          const windowStartTime = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
          const windowEndTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
          if (now < windowStartTime) {
            statusText = "Locked";
          } else if (now >= windowStartTime && now <= windowEndTime) {
            canTake = true;
            statusText = "Take";
          } else {
            statusText = "Missed";
          }
        } else if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          // Past dates not taken are marked missed
          statusText = "Missed";
        } else {
          // Future dates are locked
          statusText = "Locked";
        }

        instances.push({
          instanceId: `${med.id}_${timingIdx}`,
          medicine: med,
          scheduledTime,
          isTaken: isInstanceTaken,
          canTake,
          statusText,
        });
      });
    });

    // 3. Sort timings by scheduled time ascending
    instances.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    setFilteredMeds(instances);
  }, [medicines, historyLogs, selectedDate]);

  // Find 7 days of current week to render in horizontal strip
  const getWeekDays = () => {
    const week: Date[] = [];
    const today = new Date();
    // Find Sunday of current week
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - today.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays();

  const handleMarkTaken = async (id: string, scheduledTime: Date) => {
    const now = new Date();
    const todayStr = now.toDateString();
    const selectedStr = selectedDate.toDateString();

    if (todayStr !== selectedStr) {
      Alert.alert("Locked", "You can only mark medications taken for today!");
      return;
    }

    const windowStartTime = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
    const windowEndTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
    if (now < windowStartTime) {
      Alert.alert("Locked", "You cannot take this medication more than 1 hour before its scheduled time!");
      return;
    }
    if (now > windowEndTime) {
      Alert.alert("Expired", "This dose window has expired (more than 1 hour past scheduled time)!");
      return;
    }

    const success = await takeMed(id);
    if (success) {
      const logs = await getHistory();
      setHistoryLogs(logs);
    } else {
      Alert.alert("Error", "Failed to mark medication as taken.");
    }
  };

  const renderMedItem = ({ item }: { item: MedInstance }) => {
    const isTaken = item.statusText === "Taken";
    const isLocked = item.statusText === "Locked";
    const isMissed = item.statusText === "Missed";

    const medIconSize = fontSize("lg") * 2.5;

    return (
      <View style={[styles.medCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0, minHeight: touchTarget("minHeight") + 10 }, isTaken && styles.medCardTaken]}>
        <View style={[styles.medIconContainer, { backgroundColor: isDarkMode ? "#2e2e2e" : "#f1fdf1", width: medIconSize, height: medIconSize, borderRadius: medIconSize / 2 }]}>
          {item.medicine.imageUrl ? (
            <Image
              source={{ uri: item.medicine.imageUrl }}
              style={{ width: "100%", height: "100%", borderRadius: medIconSize / 2, resizeMode: "cover" }}
            />
          ) : (
            <FontAwesome6
              name={
                item.medicine.type === "pill"
                  ? "pills"
                  : item.medicine.type === "liquid"
                  ? "bottle-water"
                  : item.medicine.type === "injection"
                  ? "syringe"
                  : "prescription-bottle"
              }
              size={fontSize("lg")}
              color={isTaken ? "#81c784" : isMissed ? "#e57373" : "#026e02"}
            />
          )}
        </View>
        <View style={styles.medInfo}>
          <Text style={[styles.medName, { color: theme.text, fontSize: fontSize("md") }, isTaken && styles.textStrikethrough]}>
            {item.medicine.name}
          </Text>
          <Text style={[styles.medDetails, { color: theme.subText, fontSize: fontSize("sm") }]}>
            {item.medicine.dosage} • Scheduled: {item.scheduledTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </Text>
          {item.medicine.notes && <Text style={[styles.medNotes, { color: theme.subText, fontSize: fontSize("xs") }]}>Note: {item.medicine.notes}</Text>}
        </View>

        <Pressable
          style={[
            styles.checkButton,
            {
              backgroundColor: isDarkMode ? "#1e2922" : "#eafcea",
              borderColor: isDarkMode ? "#1e5e3a" : "#a5daa5",
              paddingVertical: touchTarget("paddingV") / 2,
              paddingHorizontal: touchTarget("paddingH") / 1.5,
              minHeight: touchTarget("minHeight") * 0.8,
              justifyContent: "center",
            },
            isTaken && styles.checkButtonActive,
            isLocked && [styles.checkButtonLocked, { backgroundColor: theme.border, borderColor: theme.border }],
            isMissed && [styles.checkButtonMissed, { backgroundColor: isDarkMode ? "#2d1a1a" : "#ffebee", borderColor: isDarkMode ? "#822727" : "#ffcdd2" }],
          ]}
          onPress={() => handleMarkTaken(item.medicine.id, item.scheduledTime)}
          disabled={!item.canTake}
        >
          {isTaken ? (
            <FontAwesome6 name="check" size={fontSize("xs")} color="white" />
          ) : (
            <Text
              style={[
                styles.checkButtonText,
                { color: isDarkMode ? "#81c784" : "#026e02", fontSize: fontSize("xs") },
                isLocked && [styles.checkTextLocked, { color: theme.subText }],
                isMissed && [styles.checkTextMissed, { color: isDarkMode ? "#e57373" : "#c62828" }],
              ]}
            >
              {item.statusText}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]}>
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{ minHeight: touchTarget("minHeight") / 1.2, justifyContent: "center" }}>
            <Entypo name="chevron-left" size={fontSize("xl") * 1.2} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontSize: fontSize("xl") }]}>Schedule Calendar</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Date Selector Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSelector}
        >
          {weekDays.map((day, idx) => {
            const isSelected =
              day.toDateString() === selectedDate.toDateString();
            const dayName = day.toLocaleDateString(undefined, {
              weekday: "short",
            });
            const dayNum = day.getDate();
            const isToday = day.toDateString() === new Date().toDateString();

            const calculatedWidth = fontSize("lg") * 2.8;
            const calculatedHeight = fontSize("lg") * 3.6;

            return (
              <Pressable
                key={idx}
                style={[
                  styles.dateBox,
                  {
                    width: calculatedWidth,
                    height: calculatedHeight,
                  },
                  isSelected && styles.dateBoxSelected,
                  isToday && !isSelected && styles.dateBoxToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dateDayName,
                    { fontSize: fontSize("xs") },
                    isSelected && styles.textWhite,
                    isToday && !isSelected && styles.textToday,
                  ]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dateDayNum,
                    { fontSize: fontSize("md") },
                    isSelected && styles.textWhite,
                    isToday && !isSelected && styles.textToday,
                  ]}
                >
                  {dayNum}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Medication List */}
      <View style={styles.body}>
        <View style={styles.bodyHeader}>
          <Text style={[styles.bodyTitle, { color: theme.text, fontSize: fontSize("md") }]}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Schedule"
              : selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
          </Text>
          <Text style={[styles.countBadge, { backgroundColor: isDarkMode ? "#152e1f" : "#e8f5e9", color: isDarkMode ? "#81c784" : "#2e7d32", fontSize: fontSize("xs") }]}>{filteredMeds.length} Doses</Text>
        </View>

        {filteredMeds.length > 0 ? (
          <FlatList
            data={filteredMeds}
            keyExtractor={(item: MedInstance) => item.instanceId}
            renderItem={renderMedItem}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="house-medical-circle-check"
              size={iconSize("hero")}
              color={isDarkMode ? "#00796b" : "#a5daa5"}
            />
            <Text style={[styles.emptyText, { color: theme.text, fontSize: fontSize("md") }]}>No medications scheduled.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Calendar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    color: "white",
    fontFamily: "ComicBold",
  },
  dateSelector: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 10,
    flexDirection: "row",
  },
  dateBox: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  dateBoxSelected: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dateBoxToday: {
    borderWidth: 2,
    borderColor: "white",
  },
  dateDayName: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "ComicBold",
  },
  dateDayNum: {
    color: "white",
    fontFamily: "ComicBold",
    marginTop: 2,
  },
  textWhite: {
    color: "#026e02",
  },
  textToday: {
    color: "white",
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bodyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  bodyTitle: {
    fontFamily: "ComicBold",
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 20,
  },
  medCard: {
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medCardTaken: {
    opacity: 0.8,
  },
  medIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontFamily: "ComicBold",
  },
  textStrikethrough: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  medDetails: {
    marginTop: 2,
  },
  medNotes: {
    marginTop: 4,
    fontStyle: "italic",
  },
  checkButton: {
    backgroundColor: "#eafcea",
    borderColor: "#a5daa5",
    borderWidth: 1,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonActive: {
    backgroundColor: "#81c784",
    borderColor: "#81c784",
  },
  checkButtonLocked: {
    borderWidth: 1,
  },
  checkButtonMissed: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
  },
  checkButtonText: {
    fontFamily: "ComicBold",
  },
  checkTextLocked: {},
  checkTextMissed: {
    color: "#c62828",
  },
  emptyContainer: {
    flex: 0.6,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 15,
    fontFamily: "ComicBold",
  },
});
