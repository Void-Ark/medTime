import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import CircularProgress from "@/components/medication/CircularProgress";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import QuickActionBox from "@/components/medication/QuickActionBox";
import MedCard from "@/components/medication/MedCard";
import { QUICK_ACTIONS } from "@/constants/data";
import { useMedicines } from "@/hooks/useMedicines";
import { useFocusEffect } from "expo-router";
import { getHistory } from "@/storage/history";
import { MedInstance } from "./calendar";
import { useAppTheme } from "@/providers/themeProvider";

const Home = () => {
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : useSafeAreaInsets().top;

  const { isDarkMode, theme } = useAppTheme();

  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: "missed" | "low_stock"; time?: Date }>>([]);
  const { medicines, refresh } = useMedicines();
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [todayMeds, setTodayMeds] = useState<MedInstance[]>([]);

  // Focus synchronization
  const loadAllData = async () => {
    try {
      await refresh();
      const logs = await getHistory();
      setHistoryLogs(logs);
    } catch (err) {
      console.error("Error loading home data:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // Compute timing instances dynamically on data change
  React.useEffect(() => {
    const today = new Date();
    const todayZeroTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // 1. Filter active medicines for today
    const dayFiltered = medicines.filter((m) => {
      const medStartDate = new Date(m.startDate);
      const startZeroTime = new Date(
        medStartDate.getFullYear(),
        medStartDate.getMonth(),
        medStartDate.getDate()
      );

      if (todayZeroTime < startZeroTime) return false;

      if (m.endDate) {
        const medEndDate = new Date(m.endDate);
        const endZeroTime = new Date(
          medEndDate.getFullYear(),
          medEndDate.getMonth(),
          medEndDate.getDate()
        );
        if (todayZeroTime > endZeroTime) return false;
      }

      const patternType = m.patternType || "daily";
      if (patternType === "daily") return true;
      if (patternType === "weekly" && m.pattern) {
        return m.pattern.includes(today.getDay());
      }
      if (patternType === "monthly" && m.pattern) {
        return m.pattern.includes(today.getDate());
      }
      if (patternType === "yearly") {
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        const startMonth = medStartDate.getMonth();
        const startDay = medStartDate.getDate();
        return todayMonth === startMonth && todayDay === startDay;
      }
      if (patternType === "asNeeded") return true;
      return true;
    });

    // 2. Expand active medicines into distinct timing instances for today
    const instances: MedInstance[] = [];

    dayFiltered.forEach((med) => {
      const timingsList = med.timings || [];
      timingsList.forEach((timing, timingIdx) => {
        const parsedTiming = typeof timing === "string" ? new Date(timing) : timing;

        // Construct the scheduled time for today
        const scheduledTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          parsedTiming.getHours(),
          parsedTiming.getMinutes(),
          0
        );

        // Check if this timing instance was already taken today
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

        const windowStartTime = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
        const windowEndTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
        if (isInstanceTaken) {
          statusText = "Taken";
        } else if (today < windowStartTime) {
          statusText = "Locked";
        } else if (today >= windowStartTime && today <= windowEndTime) {
          canTake = true;
          statusText = "Take";
        } else {
          statusText = "Missed";
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

    setTodayMeds(instances);
  }, [medicines, historyLogs]);

  // Compute notifications dynamically based on missed doses and stock count boundaries
  React.useEffect(() => {
    const list: Array<{ id: string; title: string; message: string; type: "missed" | "low_stock"; time?: Date }> = [];

    // 1. Check for missed doses today
    todayMeds.forEach((inst) => {
      if (inst.statusText === "Missed") {
        const timeStr = inst.scheduledTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        list.push({
          id: `missed-${inst.instanceId}`,
          title: "Missed Dose Alert",
          message: `You missed your dose of ${inst.medicine.name} scheduled for ${timeStr} today.`,
          type: "missed",
          time: inst.scheduledTime,
        });
      }
    });

    // 2. Check for low stock on all medicines (5 doses or less)
    medicines.forEach((med) => {
      if (med.stockCount <= 5) {
        list.push({
          id: `stock-${med.id}`,
          title: "Low Stock Warning",
          message: `${med.name} is running low! Only ${med.stockCount} doses remaining. Please plan a refill.`,
          type: "low_stock",
        });
      }
    });

    setNotifications(list);
  }, [todayMeds, medicines]);

  // Compute progress statistics dynamically
  const totalDoses = todayMeds.length;
  const completedDoses = todayMeds.filter((m) => m.isTaken).length;
  const progress = totalDoses > 0 ? (completedDoses / totalDoses) * 100 : 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background, flex: 1 }}
      bounces={false}
      alwaysBounceVertical={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <LinearGradient colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]} style={styles.gradient}>
        <View style={{ height: statusBarHeight }}></View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontFamily: "ComicBold" }}>Daily Progress</Text>
          <Pressable onPress={() => setIsNotificationModalVisible(true)} style={styles.notificationContainer}>
            <MaterialIcons name="notifications-none" size={28} color="white" />
            {notifications.length > 0 && <View style={styles.dot} />}
          </Pressable>
        </View>
        <CircularProgress
          progress={progress}
          totalDoses={totalDoses}
          completedDoses={completedDoses}
        />
      </LinearGradient>

      <View style={styles.quickActionsContainer}>
        <Text style={[styles.quickActionsTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <View key={action.route} style={{ width: "48%", margin: "1%" }}>
              <QuickActionBox {...action} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontFamily: "ComicBold", color: theme.text }}>Today's Schedule</Text>
        </View>
        {todayMeds.length > 0 ? (
          todayMeds.map((inst) => (
            <View key={inst.instanceId}>
              <MedCard
                medicine_name={inst.medicine.name}
                quantity={inst.medicine.dosage}
                time={inst.scheduledTime}
                taken={inst.isTaken}
                imageUrl={inst.medicine.imageUrl}
                statusText={inst.statusText}
              />
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center", marginTop: 25 }}>
            <FontAwesome6
              name="house-medical-circle-check"
              size={80}
              color={isDarkMode ? "#00796b" : "#a5daa5"}
            />
            <Text
              style={{
                color: isDarkMode ? "#80cbc4" : "#2f6f2f",
                fontSize: 16,
                marginTop: 15,
                fontFamily: "ComicBold",
                textAlign: "center",
              }}
            >
              No medications scheduled for today.
            </Text>
          </View>
        )}
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={isNotificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#37474f" : "#eee" }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
              <Pressable style={styles.closeIconButton} onPress={() => setIsNotificationModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.notificationList}>
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const isMissed = notif.type === "missed";
                  const cardBorderLeft = isMissed
                    ? (isDarkMode ? "#e57373" : "#c62828")
                    : (isDarkMode ? "#ffb74d" : "#ef6c00");

                  return (
                    <View
                      key={notif.id}
                      style={[
                        styles.notificationCard,
                        {
                          backgroundColor: isDarkMode ? "#2e2e2e" : "#f9f9f9",
                          borderColor: isDarkMode ? "#444" : "#e0e0e0",
                          borderLeftColor: cardBorderLeft,
                          borderLeftWidth: 4,
                        },
                      ]}
                    >
                      <View style={styles.notificationTitleRow}>
                        <MaterialIcons
                          name={isMissed ? "alarm-off" : "hourglass-empty"}
                          size={18}
                          color={isMissed ? (isDarkMode ? "#e57373" : "#c62828") : (isDarkMode ? "#ffb74d" : "#ef6c00")}
                        />
                        <Text style={[styles.notificationCardTitle, { color: theme.text }]}>
                          {notif.title}
                        </Text>
                      </View>
                      <Text style={[styles.notificationMessage, { color: theme.subText }]}>
                        {notif.message}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyNotifications}>
                  <FontAwesome6 name="bell-slash" size={60} color={isDarkMode ? "#00796b" : "#a5daa5"} />
                  <Text style={[styles.emptyNotificationsText, { color: theme.text }]}>All Caught Up!</Text>
                  <Text style={[styles.emptyNotificationsSubText, { color: theme.subText }]}>
                    No new alarms or low-stock refill warnings at this time.
                  </Text>
                </View>
              )}
            </ScrollView>

            <Pressable
              onPress={() => setIsNotificationModalVisible(false)}
              style={({ pressed }) => [
                styles.modalCloseBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={isDarkMode ? ["#80cbc4", "#004d40"] : ["#67fc67", "#026e02"]}
                style={styles.modalCloseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    marginLeft: 10,
    marginBottom: 10,
    fontFamily: "ComicBold",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "ComicBold",
  },
  closeIconButton: {
    padding: 4,
  },
  notificationList: {
    gap: 12,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  notificationCardTitle: {
    fontSize: 14,
    fontFamily: "ComicBold",
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: "ComicRegular",
    lineHeight: 18,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 15,
  },
  emptyNotificationsText: {
    fontSize: 15,
    fontFamily: "ComicBold",
    textAlign: "center",
  },
  emptyNotificationsSubText: {
    fontSize: 13,
    fontFamily: "ComicRegular",
    textAlign: "center",
  },
  modalCloseBtn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalCloseGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "white",
    fontSize: 16,
    fontFamily: "ComicBold",
  },
});

export default Home;
