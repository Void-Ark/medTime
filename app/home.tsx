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
  Image,
  Alert,
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
import { useAccessibility } from "@/providers/accessibilityProvider";
import { isMedicineScheduleEnded } from "@/utils/medicineUtils";

const Home = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, theme } = useAppTheme();
  const { fontSize, touchTarget, iconSize, seniorModeEnabled } = useAccessibility();

  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: "missed" | "low_stock"; time?: Date }>>([]);
  const { medicines, takeMed, snoozeMed, refresh } = useMedicines();
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [todayMeds, setTodayMeds] = useState<MedInstance[]>([]);
  const [selectedMedInstance, setSelectedMedInstance] = useState<MedInstance | null>(null);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);

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

  const handleTakeMedication = async (medInstance: MedInstance) => {
    const success = await takeMed(medInstance.medicine.id);
    if (success) {
      await loadAllData();
      setIsPhotoModalVisible(false);
    } else {
      Alert.alert("Error", "Failed to mark medication as taken.");
    }
  };

  const handleSnoozeMedication = async (medInstance: MedInstance, minutes: number) => {
    const success = await snoozeMed(medInstance.medicine.id, minutes);
    if (success) {
      await loadAllData();
      setIsPhotoModalVisible(false);
      Alert.alert("Snoozed", `Medication reminder delayed by ${minutes} minutes.`);
    } else {
      Alert.alert("Error", "Failed to snooze medication.");
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
      if (m.isArchived) return false;
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
        let statusText: "Taken" | "Locked" | "Take" | "Missed" | "Snoozed" = "Take";

        const windowStartTime = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
        const windowEndTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
        if (isInstanceTaken) {
          statusText = "Taken";
        } else if (today < windowStartTime) {
          statusText = "Locked";
        } else if (today >= windowStartTime && today <= windowEndTime) {
          canTake = true;
          if (med.snoozedUntil && new Date(med.snoozedUntil) > today) {
            statusText = "Snoozed";
          } else {
            statusText = "Take";
          }
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

    // 2. Check for low stock on all active medicines
    medicines.forEach((med) => {
      if (isMedicineScheduleEnded(med, historyLogs)) return;

      const threshold = med.refillThreshold !== undefined ? med.refillThreshold : 5;
      if (med.stockCount <= threshold) {
        list.push({
          id: `stock-${med.id}`,
          title: "Low Stock Warning",
          message: `${med.name} is running low! Only ${med.stockCount} doses remaining. Please plan a refill.`,
          type: "low_stock",
        });
      }
    });

    setNotifications(list);
  }, [todayMeds, medicines, historyLogs]);

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
          <Text style={{ color: "white", fontSize: fontSize("md"), fontFamily: "ComicBold" }}>Daily Progress</Text>
          <Pressable onPress={() => setIsNotificationModalVisible(true)} style={[styles.notificationContainer, { minHeight: touchTarget("minHeight") / 1.2, justifyContent: "center" }]}>
            <MaterialIcons name="notifications-none" size={fontSize("xl") + 2} color="white" />
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
        <Text style={[styles.quickActionsTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Quick Actions</Text>
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
          <Text style={{ fontSize: fontSize("md"), fontFamily: "ComicBold", color: theme.text }}>Today's Schedule</Text>
        </View>
        {todayMeds.length > 0 ? (
          todayMeds.map((inst) => (
            <Pressable
              key={inst.instanceId}
              onPress={() => {
                setSelectedMedInstance(inst);
                setIsPhotoModalVisible(true);
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.85 : 1.0,
                  transform: [{ scale: pressed ? 0.98 : 1.0 }]
                }
              ]}
            >
              <MedCard
                medicine_name={inst.medicine.name}
                quantity={inst.medicine.dosage}
                time={inst.scheduledTime}
                taken={inst.isTaken}
                imageUrl={inst.medicine.imageUrl}
                statusText={inst.statusText}
              />
            </Pressable>
          ))
        ) : (
          <View style={{ alignItems: "center", marginTop: 25 }}>
            <FontAwesome6
              name="house-medical-circle-check"
              size={iconSize("hero")}
              color={isDarkMode ? "#00796b" : "#a5daa5"}
            />
            <Text
              style={{
                color: isDarkMode ? "#80cbc4" : "#2f6f2f",
                fontSize: fontSize("sm"),
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
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Notifications</Text>
              <Pressable style={styles.closeIconButton} onPress={() => setIsNotificationModalVisible(false)}>
                <MaterialIcons name="close" size={fontSize("lg")} color={theme.text} />
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
                          size={fontSize("sm")}
                          color={isMissed ? (isDarkMode ? "#e57373" : "#c62828") : (isDarkMode ? "#ffb74d" : "#ef6c00")}
                        />
                        <Text style={[styles.notificationCardTitle, { color: theme.text, fontSize: fontSize("sm") }]}>
                          {notif.title}
                        </Text>
                      </View>
                      <Text style={[styles.notificationMessage, { color: theme.subText, fontSize: fontSize("xs") }]}>
                        {notif.message}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyNotifications}>
                  <FontAwesome6 name="bell-slash" size={iconSize("lg")} color={isDarkMode ? "#00796b" : "#a5daa5"} />
                  <Text style={[styles.emptyNotificationsText, { color: theme.text, fontSize: fontSize("md") }]}>All Caught Up!</Text>
                  <Text style={[styles.emptyNotificationsSubText, { color: theme.subText, fontSize: fontSize("xs") }]}>
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
                style={[styles.modalCloseGradient, { paddingVertical: touchTarget("paddingV"), minHeight: touchTarget("minHeight"), justifyContent: "center" }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.modalCloseText, { fontSize: fontSize("sm") }]}>Close</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Medication Photo Details Modal */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#37474f" : "#eee" }]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Medication Details</Text>
              <Pressable style={styles.closeIconButton} onPress={() => setIsPhotoModalVisible(false)}>
                <MaterialIcons name="close" size={fontSize("lg")} color={theme.text} />
              </Pressable>
            </View>

            {selectedMedInstance && (
              <View style={styles.photoModalBody}>
                 {/* Photo container */}
                 {selectedMedInstance.medicine.imageUrl ? (
                   <Pressable
                     onPress={() => setIsZoomModalVisible(true)}
                     style={({ pressed }) => [
                       styles.modalImageContainer,
                       { borderColor: theme.border, backgroundColor: isDarkMode ? "#2e2e2e" : "#fcfcfc", opacity: pressed ? 0.92 : 1.0 },
                     ]}
                   >
                     <Image
                       source={{ uri: selectedMedInstance.medicine.imageUrl }}
                       style={styles.modalImage}
                     />
                     <View style={styles.zoomIconIndicator}>
                       <MaterialIcons name="zoom-in" size={20} color="white" />
                     </View>
                   </Pressable>
                 ) : (
                   <View style={[styles.modalImageContainer, { borderColor: theme.border, backgroundColor: isDarkMode ? "#2e2e2e" : "#fcfcfc", alignItems: "center", justifyContent: "center" }]}>
                     <FontAwesome6
                       name={
                         selectedMedInstance.medicine.type === "pill"
                           ? "pills"
                           : selectedMedInstance.medicine.type === "liquid"
                           ? "bottle-water"
                           : selectedMedInstance.medicine.type === "injection"
                           ? "syringe"
                           : "prescription-bottle"
                       }
                       size={60}
                       color={isDarkMode ? "#80cbc4" : "#026e02"}
                     />
                   </View>
                 )}

                {/* Details Section */}
                <Text style={[styles.modalMedName, { color: theme.text, fontSize: fontSize("xl") }]}>
                  {selectedMedInstance.medicine.name}
                </Text>

                <Text style={[styles.modalMedDosage, { color: theme.subText, fontSize: fontSize("md") }]}>
                  Dosage: {selectedMedInstance.medicine.dosage}
                </Text>

                {/* Intake Status Badge */}
                <View style={styles.statusBadgeRow}>
                  {(() => {
                    const status = selectedMedInstance.statusText;
                    if (selectedMedInstance.isTaken || status === "Taken") {
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? "#152e1f" : "#e8f5e9", borderColor: isDarkMode ? "#1e5e3a" : "#c8e6c9" }]}>
                          <MaterialIcons name="check-circle" size={fontSize("sm")} color={isDarkMode ? "#81c784" : "#2e7d32"} />
                          <Text style={[styles.statusBadgeText, { color: isDarkMode ? "#81c784" : "#2e7d32", fontSize: fontSize("sm") }]}>
                            Taken
                          </Text>
                        </View>
                      );
                    }

                    let badgeBg = isDarkMode ? "#2e2e2e" : "#f5f5f5";
                    let badgeBorder = isDarkMode ? "#444" : "#e0e0e0";
                    let badgeIconColor = theme.subText;
                    let badgeIconName: any = "lock";
                    let badgeText = "Locked";

                    if (status === "Missed") {
                      badgeBg = isDarkMode ? "#2d1a1a" : "#ffebee";
                      badgeBorder = isDarkMode ? "#822727" : "#ffcdd2";
                      badgeIconColor = isDarkMode ? "#e57373" : "#c62828";
                      badgeIconName = "error";
                      badgeText = "Missed";
                    } else if (status === "Take") {
                      badgeBg = isDarkMode ? "#132535" : "#e3f2fd";
                      badgeBorder = isDarkMode ? "#1d4f7c" : "#90caf9";
                      badgeIconColor = isDarkMode ? "#64b5f6" : "#1565c0";
                      badgeIconName = "play-arrow";
                      badgeText = "Take Now";
                    } else if (status === "Snoozed") {
                      badgeBg = isDarkMode ? "#2d2417" : "#fffde7";
                      badgeBorder = isDarkMode ? "#825e27" : "#fff59d";
                      badgeIconColor = isDarkMode ? "#ffb74d" : "#ef6c00";
                      badgeIconName = "snooze";
                      let timeSuffix = "";
                      if (selectedMedInstance.medicine.snoozedUntil) {
                        const date = new Date(selectedMedInstance.medicine.snoozedUntil);
                        timeSuffix = ` (until ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`;
                      }
                      badgeText = `Snoozed${timeSuffix}`;
                    }

                    return (
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                        <MaterialIcons name={badgeIconName} size={fontSize("sm")} color={badgeIconColor} />
                        <Text style={[styles.statusBadgeText, { color: badgeIconColor, fontSize: fontSize("sm") }]}>
                          {badgeText}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
 
                {/* Timing Info */}
                <Text style={[styles.modalTimeInfo, { color: theme.subText, fontSize: fontSize("sm") }]}>
                  Scheduled: {selectedMedInstance.scheduledTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </Text>

                {/* Take Dose Now Action Button */}
                {selectedMedInstance.canTake && (
                  <Pressable
                    onPress={() => handleTakeMedication(selectedMedInstance)}
                    style={({ pressed }) => [
                      styles.modalActionBtn,
                      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={isDarkMode ? ["#004d40", "#00796b"] : ["#67fc67", "#026e02"]}
                      style={[styles.modalActionGradient, { paddingVertical: touchTarget("paddingV"), minHeight: touchTarget("minHeight"), justifyContent: "center" }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <FontAwesome6 name="check-double" size={fontSize("sm")} color="white" style={{ marginRight: 8 }} />
                      <Text style={[styles.modalActionText, { fontSize: fontSize("sm") }]}>Take Medication Now</Text>
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Snooze Options */}
                {selectedMedInstance.canTake && (
                  <View style={styles.snoozeRow}>
                    <Pressable
                      onPress={() => handleSnoozeMedication(selectedMedInstance, 15)}
                      style={({ pressed }) => [
                        styles.snoozeButton,
                        { borderColor: theme.border },
                        pressed && { opacity: 0.8 }
                      ]}
                    >
                      <MaterialIcons name="snooze" size={fontSize("sm")} color={theme.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.snoozeButtonText, { color: theme.text, fontSize: fontSize("sm") }]}>Snooze (15m)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSnoozeMedication(selectedMedInstance, 30)}
                      style={({ pressed }) => [
                        styles.snoozeButton,
                        { borderColor: theme.border },
                        pressed && { opacity: 0.8 }
                      ]}
                    >
                      <MaterialIcons name="snooze" size={fontSize("sm")} color={theme.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.snoozeButtonText, { color: theme.text, fontSize: fontSize("sm") }]}>Snooze (30m)</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
 
            <Pressable
              onPress={() => setIsPhotoModalVisible(false)}
              style={({ pressed }) => [
                styles.modalCloseBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={isDarkMode ? ["#80cbc4", "#004d40"] : ["#67fc67", "#026e02"]}
                style={[styles.modalCloseGradient, { paddingVertical: touchTarget("paddingV"), minHeight: touchTarget("minHeight"), justifyContent: "center" }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.modalCloseText, { fontSize: fontSize("sm") }]}>Close</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Medication Photo Zoom Modal */}
      <Modal
        visible={isZoomModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsZoomModalVisible(false)}
      >
        <View style={styles.zoomOverlay}>
          <Pressable style={styles.zoomCloseButton} onPress={() => setIsZoomModalVisible(false)}>
            <MaterialIcons name="close" size={30} color="white" />
          </Pressable>
          
          {selectedMedInstance?.medicine.imageUrl && (
            <ScrollView
              maximumZoomScale={5}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.zoomScrollContent}
            >
              <Image
                source={{ uri: selectedMedInstance.medicine.imageUrl }}
                style={styles.zoomImage}
              />
            </ScrollView>
          )}
          
          <View style={styles.zoomTip}>
            <Text style={styles.zoomTipText}>Pinch to Zoom / Pan to explore</Text>
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
  photoModalBody: {
    alignItems: "center",
    marginVertical: 10,
    gap: 12,
  },
  modalImageContainer: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalMedName: {
    fontSize: 22,
    fontFamily: "ComicBold",
    marginTop: 8,
    textAlign: "center",
  },
  modalMedDosage: {
    fontSize: 15,
    fontFamily: "ComicRegular",
    textAlign: "center",
  },
  statusBadgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontFamily: "ComicBold",
  },
  modalTimeInfo: {
    fontSize: 14,
    fontFamily: "ComicRegular",
    textAlign: "center",
  },
  zoomIconIndicator: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 16,
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 22,
  },
  zoomScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.75,
    resizeMode: "contain",
  },
  zoomTip: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  zoomTipText: {
    color: "white",
    fontSize: 13,
    fontFamily: "ComicRegular",
  },
  modalActionBtn: {
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  modalActionGradient: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionText: {
    color: "white",
    fontSize: 16,
    fontFamily: "ComicBold",
  },
  snoozeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
    marginTop: 10,
  },
  snoozeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
  },
  snoozeButtonText: {
    fontFamily: "ComicBold",
  },
});

export default Home;
