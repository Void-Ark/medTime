import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Medicine } from "@/schemas";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";
import { getHistory } from "@/storage/history";
import { isMedicineScheduleEnded } from "@/utils/medicineUtils";

const RefillTracker = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, theme } = useAppTheme();
  const { fontSize, touchTarget, iconSize } = useAccessibility();
  const { medicines, refillMed, updateStock, refresh } = useMedicines();
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const activeMedicines = medicines.filter((m) => {
    return !isMedicineScheduleEnded(m, historyLogs);
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [refillAmount, setRefillAmount] = useState<string>("30");
  const [totalStockAmount, setTotalStockAmount] = useState<string>("");
  const [modalMode, setModalMode] = useState<"refill" | "set">("refill");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadAllData = async () => {
    try {
      await refresh();
      const logs = await getHistory();
      setHistoryLogs(logs);
    } catch (err) {
      console.error("Error loading refill tracker data:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const getLowStockCount = () => {
    return activeMedicines.filter((m) => {
      const threshold = m.refillThreshold !== undefined ? m.refillThreshold : 5;
      return m.stockCount <= threshold;
    }).length;
  };

  const getFilteredMedicines = () => {
    return activeMedicines.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleOpenRefill = (med: Medicine) => {
    setSelectedMed(med);
    setRefillAmount("30"); // default convenient standard pack
    setTotalStockAmount(med.stockCount.toString());
    setModalMode("refill");
    setIsModalVisible(true);
  };

  const handleConfirmRefill = async () => {
    if (!selectedMed) return;

    if (modalMode === "refill") {
      const amount = parseInt(refillAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid dosage count to refill.");
        return;
      }

      const success = await refillMed(selectedMed.id, amount);
      if (success) {
        setIsModalVisible(false);
        setSelectedMed(null);
      } else {
        alert("Failed to update medication stock. Please try again.");
      }
    } else {
      const totalAmount = parseInt(totalStockAmount);
      if (isNaN(totalAmount) || totalAmount < 0) {
        alert("Please enter a valid stock count.");
        return;
      }

      const success = await updateStock(selectedMed.id, totalAmount);
      if (success) {
        setIsModalVisible(false);
        setSelectedMed(null);
      } else {
        alert("Failed to update medication stock. Please try again.");
      }
    }
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => {
    const threshold = item.refillThreshold !== undefined ? item.refillThreshold : 5;
    const isLowStock = item.stockCount <= threshold;

    // Smooth progress representation
    const displayMax = Math.max(30, threshold * 3);
    const progressPercent = Math.min(100, Math.max(0, (item.stockCount / displayMax) * 100));

    // Curated dynamic colors depending on stock warning status
    let progressBarColor = isDarkMode ? "#4caf50" : "#2e7d32"; // Healthy green
    let badgeBg = isDarkMode ? "#1b301c" : "#eafcea";
    let badgeTextColor = isDarkMode ? "#81c784" : "#2e7d32";

    if (isLowStock) {
      progressBarColor = isDarkMode ? "#f44336" : "#c62828"; // Warning red
      badgeBg = isDarkMode ? "#2d1a1a" : "#ffebee";
      badgeTextColor = isDarkMode ? "#e57373" : "#c62828";
    } else if (item.stockCount <= threshold * 2) {
      progressBarColor = isDarkMode ? "#ff9800" : "#ef6c00"; // Warning orange
      badgeBg = isDarkMode ? "#2d241a" : "#fff3e0";
      badgeTextColor = isDarkMode ? "#ffb74d" : "#ef6c00";
    }

    const iconBoxSize = fontSize("lg") * 2.2;

    return (
      <View style={[styles.medCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0, minHeight: touchTarget("minHeight") + 10 }]}>
        <View style={styles.cardHeader}>
          {/* Visual Icon */}
          <View style={[styles.medIconContainer, { backgroundColor: isDarkMode ? "#2e2e2e" : "#f5f5f5", width: iconBoxSize, height: iconBoxSize, borderRadius: iconBoxSize / 2 }]}>
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
                color={progressBarColor}
              />
            )}
          </View>

          {/* Core Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.medName, { color: theme.text, fontSize: fontSize("md") }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.medDetails, { color: theme.subText, fontSize: fontSize("sm") }]}>
              Dosage Unit: {item.dosage}
            </Text>
          </View>

          {/* Easy Trigger Refill button */}
          <Pressable
            style={({ pressed }) => [
              styles.refillTriggerBtn,
              {
                backgroundColor: isDarkMode ? "#2c2214" : "#fff8e1",
                borderColor: isDarkMode ? "#573d12" : "#ffe082",
                paddingVertical: touchTarget("paddingV") / 2,
                paddingHorizontal: touchTarget("paddingH") / 1.5,
                minHeight: touchTarget("minHeight") * 0.8,
                justifyContent: "center",
              },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => handleOpenRefill(item)}
          >
            <Ionicons name="add-circle-outline" size={fontSize("xs")} color={isDarkMode ? "#ffb74d" : "#f57c00"} />
            <Text style={[styles.refillTriggerText, { color: isDarkMode ? "#ffb74d" : "#f57c00", fontSize: fontSize("xs") }]}>Refill</Text>
          </Pressable>
        </View>

        {/* Stock status indicator */}
        <View style={styles.stockStatusContainer}>
          <View style={styles.stockLabelRow}>
            <Text style={[styles.stockAmountText, { color: theme.text, fontSize: fontSize("sm") }]}>
              Current: <Text style={{ fontFamily: "ComicBold", color: badgeTextColor }}>{item.stockCount} doses</Text>
            </Text>
            <Text style={[styles.thresholdLabel, { color: theme.subText, fontSize: fontSize("xs") }]}>
              Alert if ≤ {threshold}
            </Text>
          </View>

          {/* Beautiful progress bar */}
          <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? "#2a2a2a" : "#eee" }]}>
            <View
              style={[
                styles.progressBarActive,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: progressBarColor,
                },
              ]}
            />
          </View>

          {/* Status Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: progressBarColor, borderWidth: isDarkMode ? 0.5 : 0 }]}>
              <Text style={[styles.statusBadgeText, { color: badgeTextColor, fontSize: fontSize("xs") }]}>
                {isLowStock ? "Needs Refill ASAP" : (item.stockCount <= threshold * 2 ? "Low Stock Warning" : "Healthy Stock")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header with LinearGradient */}
      <LinearGradient colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]}>
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { minHeight: touchTarget("minHeight") / 1.2, justifyContent: "center" }]}>
            <Entypo name="chevron-left" size={fontSize("xl") * 1.2} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontSize: fontSize("xl") }]}>Refill Tracker</Text>
          <View style={{ width: 32 }}></View>
        </View>
      </LinearGradient>

      {/* Quick stats widgets */}
      <View style={styles.statsContainer}>
        <View style={[styles.statWidget, { backgroundColor: theme.card }]}>
          <FontAwesome6 name="prescription-bottle-medical" size={fontSize("xl")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: theme.text, fontSize: fontSize("xl") }]}>{activeMedicines.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subText, fontSize: fontSize("xs") }]}>Tracked Meds</Text>
          </View>
        </View>

        <View style={[styles.statWidget, { backgroundColor: theme.card }]}>
          <MaterialIcons name="error-outline" size={fontSize("xl") * 1.1} color={getLowStockCount() > 0 ? (isDarkMode ? "#e57373" : "#c62828") : (isDarkMode ? "#80cbc4" : "#026e02")} />
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: getLowStockCount() > 0 ? (isDarkMode ? "#e57373" : "#c62828") : theme.text, fontSize: fontSize("xl") }]}>
              {getLowStockCount()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subText, fontSize: fontSize("xs") }]}>Low Stock Alerts</Text>
          </View>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={fontSize("md")} color={theme.subText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search medication name..."
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text, fontSize: fontSize("sm"), minHeight: touchTarget("minHeight") * 0.8 }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialIcons name="cancel" size={fontSize("md")} color={theme.subText} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Main List */}
      {getFilteredMedicines().length > 0 ? (
        <FlatList
          data={getFilteredMedicines()}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicineItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={iconSize("hero")} color={isDarkMode ? "#00796b" : "#a5daa5"} />
          <Text style={[styles.emptyText, { color: theme.text, fontSize: fontSize("md") }]}>
            {searchQuery.length > 0 ? "No matching medications found." : "No tracked medications found."}
          </Text>
          {searchQuery.length === 0 && (
            <Pressable style={[styles.addMedBtn, { minHeight: touchTarget("minHeight"), paddingVertical: touchTarget("paddingV"), paddingHorizontal: touchTarget("paddingH"), justifyContent: "center", alignItems: "center" }]} onPress={() => router.push("/add")}>
              <Text style={[styles.addMedBtnText, { fontSize: fontSize("md") }]}>Add Medication</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Quick Refill Modal Sheet */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#37474f" : "#eee" }]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Quick Refill</Text>
              <Pressable style={styles.closeIconButton} onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={fontSize("lg")} color={theme.text} />
              </Pressable>
            </View>

            {selectedMed && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Details banner */}
                <View style={[styles.modalMedBanner, { backgroundColor: isDarkMode ? "#2e2e2e" : "#fcfcfc" }]}>
                  <Text style={[styles.modalMedName, { color: theme.text, fontSize: fontSize("md") }]}>
                    {selectedMed.name}
                  </Text>
                  <Text style={[styles.modalMedDetails, { color: theme.subText, fontSize: fontSize("xs") }]}>
                    Dosage Unit: {selectedMed.dosage} • Current Stock: {selectedMed.stockCount} doses
                  </Text>
                </View>

                {/* Mode Selector Tab Container */}
                <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f5f5f5" }]}>
                  <Pressable
                    style={[
                      styles.tabBtn,
                      { paddingVertical: touchTarget("paddingV") / 1.5 },
                      modalMode === "refill" && [
                        styles.tabActiveBtn,
                        { backgroundColor: theme.card }
                      ]
                    ]}
                    onPress={() => setModalMode("refill")}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: modalMode === "refill" ? (isDarkMode ? "#80cbc4" : "#026e02") : theme.text, fontSize: fontSize("xs") }
                      ]}
                    >
                      Refill (Add)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.tabBtn,
                      { paddingVertical: touchTarget("paddingV") / 1.5 },
                      modalMode === "set" && [
                        styles.tabActiveBtn,
                        { backgroundColor: theme.card }
                      ]
                    ]}
                    onPress={() => setModalMode("set")}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: modalMode === "set" ? (isDarkMode ? "#80cbc4" : "#026e02") : theme.text, fontSize: fontSize("xs") }
                      ]}
                    >
                      Set Total Stock
                    </Text>
                  </Pressable>
                </View>

                {modalMode === "refill" ? (
                  <>
                    {/* Input quantity */}
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: fontSize("sm") }]}>
                      How many doses/units would you like to add?
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, fontSize: fontSize("sm"), minHeight: touchTarget("minHeight") * 0.8, paddingVertical: touchTarget("paddingV") / 2 }]}
                        keyboardType="number-pad"
                        value={refillAmount}
                        onChangeText={setRefillAmount}
                        maxLength={5}
                      />
                      <Text style={[styles.modalDoseLabel, { color: theme.subText, fontSize: fontSize("sm") }]}>doses</Text>
                    </View>

                    {/* Convenient Presets */}
                    <View style={styles.presetsContainer}>
                      {["10", "30", "60", "90"].map((preset) => (
                        <Pressable
                          key={preset}
                          onPress={() => setRefillAmount(preset)}
                          style={[
                            styles.presetBadge,
                            {
                              backgroundColor: refillAmount === preset 
                                ? (isDarkMode ? "#004d40" : "#e8f5e9") 
                                : (isDarkMode ? "#2a2a2a" : "#f5f5f5"),
                              borderColor: refillAmount === preset 
                                ? (isDarkMode ? "#80cbc4" : "#026e02") 
                                : (isDarkMode ? "#444" : "#e0e0e0"),
                              minHeight: touchTarget("minHeight") * 0.8,
                              paddingVertical: touchTarget("paddingV") / 2,
                            }
                          ]}
                        >
                          <Text style={[
                            styles.presetText,
                            {
                              color: refillAmount === preset 
                                ? (isDarkMode ? "#80cbc4" : "#026e02") 
                                : theme.text,
                              fontSize: fontSize("xs"),
                            }
                          ]}>
                            +{preset}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Preview section */}
                    <View style={[styles.previewContainer, { backgroundColor: isDarkMode ? "#122513" : "#f1edf9" }]}>
                      <Text style={[styles.previewText, { color: isDarkMode ? "#81c784" : "#5d38a0", fontSize: fontSize("xs") }]}>
                        New Stock Preview: <Text style={{ fontFamily: "ComicBold" }}>
                          {selectedMed.stockCount} + {parseInt(refillAmount) || 0} = {(selectedMed.stockCount + (parseInt(refillAmount) || 0))} doses
                        </Text>
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Set Total Stock input */}
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: fontSize("sm") }]}>
                      Enter the new total stock count:
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, fontSize: fontSize("sm"), minHeight: touchTarget("minHeight") * 0.8, paddingVertical: touchTarget("paddingV") / 2 }]}
                        keyboardType="number-pad"
                        value={totalStockAmount}
                        onChangeText={setTotalStockAmount}
                        maxLength={5}
                      />
                      <Text style={[styles.modalDoseLabel, { color: theme.subText, fontSize: fontSize("sm") }]}>doses</Text>
                    </View>

                    {/* Preview section for set */}
                    <View style={[styles.previewContainer, { backgroundColor: isDarkMode ? "#122513" : "#f1edf9" }]}>
                      <Text style={[styles.previewText, { color: isDarkMode ? "#81c784" : "#5d38a0", fontSize: fontSize("xs") }]}>
                        New Stock Preview: <Text style={{ fontFamily: "ComicBold" }}>
                          {parseInt(totalStockAmount) || 0} doses
                        </Text>
                      </Text>
                    </View>
                  </>
                )}

                {/* Action buttons */}
                <Pressable
                  onPress={handleConfirmRefill}
                  style={({ pressed }) => [
                    styles.modalSaveBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <LinearGradient
                    colors={isDarkMode ? ["#80cbc4", "#004d40"] : ["#67fc67", "#026e02"]}
                    style={[styles.modalSaveGradient, { paddingVertical: touchTarget("paddingV"), minHeight: touchTarget("minHeight"), justifyContent: "center" }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.modalSaveText, { fontSize: fontSize("sm") }]}>
                      {modalMode === "refill" ? "Confirm Refill" : "Update Total Stock"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: theme.border, paddingVertical: touchTarget("paddingV"), minHeight: touchTarget("minHeight") }]}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.text, fontSize: fontSize("sm") }]}>Cancel</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default RefillTracker;

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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 12,
  },
  statWidget: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontFamily: "ComicBold",
  },
  statLabel: {
    fontFamily: "ComicRegular",
    marginTop: 1,
  },
  searchContainer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "ComicRegular",
  },
  listContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  medCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  medIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  medImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    flex: 1,
  },
  medName: {
    fontFamily: "ComicBold",
  },
  medDetails: {
    fontFamily: "ComicRegular",
    marginTop: 2,
  },
  refillTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  refillTriggerText: {
    fontFamily: "ComicBold",
  },
  stockStatusContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  stockLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  stockAmountText: {
    fontFamily: "ComicRegular",
  },
  thresholdLabel: {
    fontFamily: "ComicRegular",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarActive: {
    height: "100%",
    borderRadius: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
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
    gap: 14,
    paddingBottom: 10,
  },
  modalMedBanner: {
    borderRadius: 12,
    padding: 12,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  tabActiveBtn: {
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    fontFamily: "ComicBold",
  },
  modalMedName: {
    fontFamily: "ComicBold",
    textAlign: "center",
  },
  modalMedDetails: {
    fontFamily: "ComicRegular",
    textAlign: "center",
    marginTop: 3,
  },
  inputLabel: {
    fontFamily: "ComicBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: "ComicBold",
  },
  modalDoseLabel: {
    fontFamily: "ComicBold",
  },
  presetsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginVertical: 4,
  },
  presetBadge: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontFamily: "ComicBold",
  },
  previewContainer: {
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginVertical: 2,
  },
  previewText: {
    fontFamily: "ComicRegular",
  },
  modalSaveBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  modalSaveGradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: "white",
    fontFamily: "ComicBold",
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: "ComicBold",
  },
});
