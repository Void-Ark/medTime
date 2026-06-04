import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  Image,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { getHistory, clearHistory } from "@/storage/history";
import { IntakeLog, Medicine } from "@/schemas";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";
import { useMedicines } from "@/hooks/useMedicines";

const History = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, theme } = useAppTheme();
  const { fontSize, touchTarget, iconSize } = useAccessibility();
  const { medicines, refresh: refreshMedicines } = useMedicines();

  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<IntakeLog | null>(null);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [medTakeHistory, setMedTakeHistory] = useState<IntakeLog[]>([]);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);

  const fetchHistory = async () => {
    const data = await getHistory();
    setLogs(data);
    try {
      await refreshMedicines();
    } catch (err) {
      console.error("Error refreshing medicines inside history:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const handleClear = () => {
    Alert.alert(
      "Clear History Logs",
      "Are you absolutely sure you want to clear all past medication intake history logs? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            const success = await clearHistory();
            if (success) {
              setLogs([]);
            } else {
              Alert.alert("Error", "Failed to clear intake history.");
            }
          },
        },
      ]
    );
  };

  const handleLogPress = (item: IntakeLog) => {
    // 1. Find corresponding medicine record (works even if ended, as it remains in database)
    const med = medicines.find((m) => m.id === item.medicineId) || null;
    
    // 2. Gather full take history logs for this medicine
    const medHistory = logs.filter((l) => l.medicineId === item.medicineId);

    setSelectedLog(item);
    setSelectedMed(med);
    setMedTakeHistory(medHistory);
    setIsDetailsModalVisible(true);
  };

  const renderLogItem = ({ item }: { item: IntakeLog }) => {
    const date = new Date(item.takenAt);
    const dateString = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeString = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <Pressable
        onPress={() => handleLogPress(item)}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.9 : 1.0,
            transform: [{ scale: pressed ? 0.99 : 1.0 }],
          },
        ]}
      >
        <View style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0, minHeight: touchTarget("minHeight") + 10 }]}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="circle-check" size={fontSize("lg")} color="#026e02" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.medName, { color: theme.text, fontSize: fontSize("md") }]}>{item.medicineName}</Text>
            <Text style={[styles.dosageText, { color: theme.subText, fontSize: fontSize("sm") }]}>Dosage: {item.dosage}</Text>
            <Text style={[styles.timestampText, { color: theme.subText, fontSize: fontSize("xs") }]}>
              {dateString} • {timeString}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? "#1b301c" : "#e8f5e9" }]}>
            <Text style={[styles.badgeText, { color: isDarkMode ? "#81c784" : "#2e7d32", fontSize: fontSize("xs") }]}>Taken</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]}>
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { minHeight: touchTarget("minHeight") / 1.2, justifyContent: "center" }]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Entypo name="chevron-left" size={fontSize("xl") * 1.2} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontSize: fontSize("xl") }]}>Intake History</Text>
          {logs.length > 0 ? (
            <Pressable onPress={handleClear} style={{ minHeight: touchTarget("minHeight") / 1.2, justifyContent: "center" }}>
              <Entypo name="trash" size={fontSize("lg")} color="#ffffff" />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>
      </LinearGradient>

      {logs.length > 0 ? (
        <FlatList
          data={logs}
          keyExtractor={(item: IntakeLog) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="book-medical" size={iconSize("hero")} color={isDarkMode ? "#00796b" : "#a5daa5"} />
          <Text style={[styles.emptyText, { color: theme.text, fontSize: fontSize("md") }]}>No medication history logged yet.</Text>
        </View>
      )}
      {/* Detailed Intake History Modal */}
      <Modal
        visible={isDetailsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#37474f" : "#eee" }]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Intake Details</Text>
              <Pressable style={styles.closeIconButton} onPress={() => setIsDetailsModalVisible(false)}>
                <MaterialIcons name="close" size={fontSize("lg")} color={theme.text} />
              </Pressable>
            </View>

            {selectedLog && (
              <View style={styles.modalBody}>
                {/* Medicine Photo Banner */}
                {selectedMed?.imageUrl ? (
                  <Pressable
                    onPress={() => setIsZoomModalVisible(true)}
                    style={({ pressed }) => [
                      styles.modalImageContainer,
                      { borderColor: theme.border, backgroundColor: isDarkMode ? "#2e2e2e" : "#fcfcfc", opacity: pressed ? 0.92 : 1.0 },
                    ]}
                  >
                    <Image
                      source={{ uri: selectedMed.imageUrl }}
                      style={styles.modalImage}
                    />
                    <View style={styles.zoomIconIndicator}>
                      <MaterialIcons name="zoom-in" size={fontSize("sm")} color="white" />
                    </View>
                  </Pressable>
                ) : (
                  <View style={[styles.modalImageContainer, { borderColor: theme.border, backgroundColor: isDarkMode ? "#2e2e2e" : "#fcfcfc" }]}>
                    <FontAwesome6
                      name={
                        selectedMed?.type === "pill"
                          ? "pills"
                          : selectedMed?.type === "liquid"
                          ? "bottle-water"
                          : selectedMed?.type === "injection"
                          ? "syringe"
                          : "prescription-bottle"
                      }
                      size={iconSize("lg")}
                      color={isDarkMode ? "#80cbc4" : "#026e02"}
                    />
                  </View>
                )}

                {/* Details Section */}
                <Text style={[styles.modalMedName, { color: theme.text, fontSize: fontSize("xl") }]} numberOfLines={1}>
                  {selectedLog.medicineName}
                </Text>
                <Text style={[styles.modalMedDosage, { color: theme.subText, fontSize: fontSize("md") }]}>
                  Prescribed Dosage: {selectedLog.dosage}
                </Text>

                {/* All Intake History Timeline */}
                <View style={styles.historyListSection}>
                  <Text style={[styles.historySectionTitle, { color: theme.text, fontSize: fontSize("sm") }]}>
                    All Intake History ({medTakeHistory.length})
                  </Text>
                  
                  <FlatList
                    data={medTakeHistory}
                    keyExtractor={(take) => take.id}
                    renderItem={({ item: take }) => {
                      const date = new Date(take.takenAt);
                      const dStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                      const tStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });

                      return (
                        <View style={[styles.historyRow, { borderBottomColor: isDarkMode ? "#37474f" : "#eee" }]}>
                          <MaterialIcons name="check-circle" size={fontSize("sm")} color={isDarkMode ? "#81c784" : "#2e7d32"} />
                          <Text style={[styles.historyRowText, { color: theme.text, fontSize: fontSize("xs") }]}>
                            {dStr} at {tStr}
                          </Text>
                        </View>
                      );
                    }}
                    style={styles.historyTimelineFlatList}
                    contentContainerStyle={{ gap: 4 }}
                    nestedScrollEnabled={true}
                  />
                </View>
              </View>
            )}

            {/* Gradient Close button */}
            <Pressable
              onPress={() => setIsDetailsModalVisible(false)}
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
            <MaterialIcons name="close" size={fontSize("xl")} color="white" />
          </Pressable>
          
          {selectedMed?.imageUrl && (
            <ScrollView
              maximumZoomScale={5}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.zoomScrollContent}
            >
              <Image
                source={{ uri: selectedMed.imageUrl }}
                style={styles.zoomImage}
              />
            </ScrollView>
          )}
          
          <View style={styles.zoomTip}>
            <Text style={[styles.zoomTipText, { fontSize: fontSize("xs") }]}>Pinch to Zoom / Pan to explore</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default History;

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
    padding: 15,
  },
  logCard: {
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconContainer: {
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  medName: {
    fontFamily: "ComicBold",
  },
  dosageText: {
    marginTop: 2,
  },
  timestampText: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
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
    fontFamily: "ComicBold",
  },
  closeIconButton: {
    padding: 4,
  },
  modalBody: {
    alignItems: "center",
    marginVertical: 10,
    gap: 12,
    width: "100%",
  },
  modalImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
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
    fontFamily: "ComicBold",
    marginTop: 4,
    textAlign: "center",
  },
  modalMedDosage: {
    fontFamily: "ComicRegular",
    textAlign: "center",
  },
  historyListSection: {
    width: "100%",
    height: 180,
    marginTop: 5,
    paddingHorizontal: 5,
  },
  historySectionTitle: {
    fontFamily: "ComicBold",
    marginBottom: 8,
  },
  historyTimelineFlatList: {
    width: "100%",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  historyRowText: {
    fontFamily: "ComicRegular",
  },
  modalCloseBtn: {
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  modalCloseGradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "white",
    fontFamily: "ComicBold",
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
    fontFamily: "ComicRegular",
  },
});
