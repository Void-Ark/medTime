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

        // Determine intake availability
        let canTake = false;
        let statusText: "Taken" | "Locked" | "Take" | "Missed" = "Take";

        if (isInstanceTaken) {
          statusText = "Taken";
        } else if (!isToday) {
          if (selectedDate < now) {
            statusText = "Missed";
          } else {
            statusText = "Locked";
          }
        } else {
          // Today
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
  }, [selectedDate, medicines, historyLogs]);

  // Generate 7 days of the week around today
  const getWeekDays = () => {
    const today = new Date();
    const week = [];
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

    return (
      <View style={[styles.medCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }, isTaken && styles.medCardTaken]}>
        <View style={[styles.medIconContainer, { backgroundColor: isDarkMode ? "#2e2e2e" : "#f1fdf1" }]}>
          {item.medicine.imageUrl ? (
            <Image
              source={{ uri: item.medicine.imageUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 12, resizeMode: "cover" }}
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
              size={28}
              color={isTaken ? "#81c784" : isMissed ? "#e57373" : "#026e02"}
            />
          )}
        </View>
        <View style={styles.medInfo}>
          <Text style={[styles.medName, { color: theme.text }, isTaken && styles.textStrikethrough]}>
            {item.medicine.name}
          </Text>
          <Text style={[styles.medDetails, { color: theme.subText }]}>
            {item.medicine.dosage} • Scheduled: {item.scheduledTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </Text>
          {item.medicine.notes && <Text style={[styles.medNotes, { color: theme.subText }]}>Note: {item.medicine.notes}</Text>}
        </View>

        <Pressable
          style={[
            styles.checkButton,
            {
              backgroundColor: isDarkMode ? "#1e2922" : "#eafcea",
              borderColor: isDarkMode ? "#1e5e3a" : "#a5daa5",
            },
            isTaken && styles.checkButtonActive,
            isLocked && [styles.checkButtonLocked, { backgroundColor: theme.border, borderColor: theme.border }],
            isMissed && [styles.checkButtonMissed, { backgroundColor: isDarkMode ? "#2d1a1a" : "#ffebee", borderColor: isDarkMode ? "#822727" : "#ffcdd2" }],
          ]}
          onPress={() => handleMarkTaken(item.medicine.id, item.scheduledTime)}
          disabled={!item.canTake}
        >
          {isTaken ? (
            <FontAwesome6 name="check" size={14} color="white" />
          ) : (
            <Text
              style={[
                styles.checkButtonText,
                { color: isDarkMode ? "#81c784" : "#026e02" },
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
          <Pressable onPress={() => router.back()}>
            <Entypo name="chevron-left" size={32} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Schedule Calendar</Text>
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

            return (
              <Pressable
                key={idx}
                style={[
                  styles.dateBox,
                  isSelected && styles.dateBoxSelected,
                  isToday && !isSelected && styles.dateBoxToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dateDayName,
                    isSelected && styles.textWhite,
                    isToday && !isSelected && styles.textToday,
                  ]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dateDayNum,
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
          <Text style={[styles.bodyTitle, { color: theme.text }]}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Schedule"
              : selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
          </Text>
          <Text style={[styles.countBadge, { backgroundColor: isDarkMode ? "#152e1f" : "#e8f5e9", color: isDarkMode ? "#81c784" : "#2e7d32" }]}>{filteredMeds.length} Doses</Text>
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
              size={80}
              color={isDarkMode ? "#00796b" : "#a5daa5"}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>No medications scheduled.</Text>
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
    fontSize: 22,
    fontFamily: "ComicBold",
  },
  dateSelector: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 10,
    flexDirection: "row",
  },
  dateBox: {
    width: 55,
    height: 70,
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
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "ComicBold",
  },
  dateDayNum: {
    fontSize: 18,
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
    fontSize: 18,
    fontFamily: "ComicBold",
  },
  countBadge: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
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
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 17,
    fontFamily: "ComicBold",
  },
  textStrikethrough: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  medDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  medNotes: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
  checkButton: {
    backgroundColor: "#eafcea",
    borderColor: "#a5daa5",
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
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
    color: "#026e02",
    fontSize: 12,
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
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
    fontFamily: "ComicBold",
  },
});
