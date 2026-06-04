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
import { useMedicines } from "@/hooks/useMedicines";

const History = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, theme } = useAppTheme();
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
        <View style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="circle-check" size={24} color="#026e02" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.medName, { color: theme.text }]}>{item.medicineName}</Text>
            <Text style={[styles.dosageText, { color: theme.subText }]}>Dosage: {item.dosage}</Text>
            <Text style={[styles.timestampText, { color: theme.subText }]}>
              {dateString} • {timeString}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? "#1b301c" : "#e8f5e9" }]}>
            <Text style={[styles.badgeText, { color: isDarkMode ? "#81c784" : "#2e7d32" }]}>Taken</Text>
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
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Entypo name="chevron-left" size={32} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Intake History</Text>
          {logs.length > 0 ? (
            <Pressable onPress={handleClear}>
              <Entypo name="trash" size={24} color="#ffffff" />
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
          <FontAwesome6 name="book-medical" size={80} color={isDarkMode ? "#00796b" : "#a5daa5"} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No medication history logged yet.</Text>
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>Intake Details</Text>
              <Pressable style={styles.closeIconButton} onPress={() => setIsDetailsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
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
                      <MaterialIcons name="zoom-in" size={20} color="white" />
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
                      size={60}
                      color={isDarkMode ? "#80cbc4" : "#026e02"}
                    />
                  </View>
                )}

                {/* Details Section */}
                <Text style={[styles.modalMedName, { color: theme.text }]} numberOfLines={1}>
                  {selectedLog.medicineName}
                </Text>
                <Text style={[styles.modalMedDosage, { color: theme.subText }]}>
                  Prescribed Dosage: {selectedLog.dosage}
                </Text>

                {/* All Intake History Timeline */}
                <View style={styles.historyListSection}>
                  <Text style={[styles.historySectionTitle, { color: theme.text }]}>
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
                          <MaterialIcons name="check-circle" size={18} color={isDarkMode ? "#81c784" : "#2e7d32"} />
                          <Text style={[styles.historyRowText, { color: theme.text }]}>
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
            <Text style={styles.zoomTipText}>Pinch to Zoom / Pan to explore</Text>
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
    fontSize: 22,
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
    fontSize: 18,
    fontFamily: "ComicBold",
  },
  dosageText: {
    fontSize: 14,
    marginTop: 2,
  },
  timestampText: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
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
    fontSize: 20,
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
    fontSize: 22,
    fontFamily: "ComicBold",
    marginTop: 4,
    textAlign: "center",
  },
  modalMedDosage: {
    fontSize: 14,
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
    fontSize: 15,
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
    fontSize: 13,
    fontFamily: "ComicRegular",
  },
  modalCloseBtn: {
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
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
});
