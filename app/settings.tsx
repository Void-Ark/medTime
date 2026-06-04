import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Switch,
  Share,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";
import { exportBackupData, importBackupData } from "@/storage/db";

const Settings = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : insets.top;

  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const {
    seniorModeEnabled,
    toggleSeniorMode,
    loudAlarmsEnabled,
    toggleLoudAlarms,
    fontSize,
    touchTarget,
  } = useAccessibility();

  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [pastedBackup, setPastedBackup] = useState<string>("");

  // Load reminder settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const notify = await AsyncStorage.getItem("notifications_enabled");
        setNotificationsEnabled(notify !== "false"); // Defaults to true
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Persist Reminder settings
  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem("notifications_enabled", value ? "true" : "false");
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  };

  // Export medicines & history database
  const handleExport = async () => {
    try {
      const { medicines, history, images } = await exportBackupData();

      const backupObj = {
        medicines,
        history,
        images,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };

      const backupStr = JSON.stringify(backupObj, null, 2);

      await Share.share({
        message: backupStr,
        title: "MedTime Backup Export",
      });
    } catch (error) {
      console.error("Error exporting backup:", error);
      Alert.alert("Export Failed", "Could not serialize local medication data.");
    }
  };

  // Import medicines & history database
  const handleImport = async () => {
    if (!pastedBackup.trim()) {
      Alert.alert("Validation Error", "Please paste your exported JSON backup string.");
      return;
    }

    try {
      const parsed = JSON.parse(pastedBackup);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid backup JSON format");
      }
      if (!Array.isArray(parsed.medicines)) {
        throw new Error("Backup file must contain a medicines array");
      }
      if (parsed.history && !Array.isArray(parsed.history)) {
        throw new Error("Backup history must be a valid array");
      }

      Alert.alert(
        "Confirm Data Restore",
        "Restoring this backup will replace all active medications and history logs. This action cannot be undone. Do you want to proceed?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              try {
                await importBackupData(parsed);
                setImportModalVisible(false);
                setPastedBackup("");
                Alert.alert("Success", "Medication database successfully restored!");
              } catch (writeErr) {
                console.error("Write error:", writeErr);
                Alert.alert("Restore Failed", "Failed to write database records to storage.");
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error importing backup:", error);
      Alert.alert("Restore Failed", `Invalid JSON structure: ${error?.message || "Check formatting"}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header Panel */}
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
          <Text style={[styles.headerTitle, { fontSize: fontSize("xl") }]}>Settings Panel</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Theme Settings Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="color-lens" size={fontSize("xl")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Appearance</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: fontSize("md") }]}>Dark Mode</Text>
              <Text style={[styles.settingDesc, { fontSize: fontSize("xs") }]}>Toggle a sleek nocturnal appearance</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: "#ccc", true: isDarkMode ? "#80cbc4" : "#a5daa5" }}
              thumbColor={isDarkMode ? "#00796b" : "#026e02"}
            />
          </View>
        </View>

        {/* Accessibility Settings Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="accessibility" size={fontSize("xl")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Accessibility Options</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: fontSize("md") }]}>Senior Layout Mode</Text>
              <Text style={[styles.settingDesc, { fontSize: fontSize("xs") }]}>Enlarges text sizing and button touch targets for easier reading and tapping</Text>
            </View>
            <Switch
              value={seniorModeEnabled}
              onValueChange={toggleSeniorMode}
              trackColor={{ false: "#ccc", true: isDarkMode ? "#80cbc4" : "#a5daa5" }}
              thumbColor={seniorModeEnabled ? (isDarkMode ? "#00796b" : "#026e02") : "#f4f3f3"}
            />
          </View>

          <View style={[styles.settingRow, { marginTop: 15 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: fontSize("md") }]}>Louder & Repeating Alarms</Text>
              <Text style={[styles.settingDesc, { fontSize: fontSize("xs") }]}>Repeats notification triggers every 10 minutes and uses intense vibration patterns</Text>
            </View>
            <Switch
              value={loudAlarmsEnabled}
              onValueChange={toggleLoudAlarms}
              trackColor={{ false: "#ccc", true: isDarkMode ? "#80cbc4" : "#a5daa5" }}
              thumbColor={loudAlarmsEnabled ? (isDarkMode ? "#00796b" : "#026e02") : "#f4f3f3"}
            />
          </View>
        </View>

        {/* Notifications Settings Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="notifications" size={fontSize("xl")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Reminders Settings</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: fontSize("md") }]}>Active Alarms</Text>
              <Text style={[styles.settingDesc, { fontSize: fontSize("xs") }]}>Enable global alarms and reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#ccc", true: isDarkMode ? "#80cbc4" : "#a5daa5" }}
              thumbColor={notificationsEnabled ? (isDarkMode ? "#00796b" : "#026e02") : "#f4f3f3"}
            />
          </View>
        </View>

        {/* Backup Database Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="backup" size={fontSize("xl")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
            <Text style={[styles.cardTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Data Backup & Recovery</Text>
          </View>

          <Text style={[styles.settingDescParagraph, { color: theme.subText, fontSize: fontSize("xs") }]}>
            Export your complete medications list and intake logs to store as an offline JSON backup, or import past data values below.
          </Text>

          <View style={styles.buttonRow}>
            {/* Export */}
            <Pressable
              style={[
                styles.btn,
                {
                  backgroundColor: isDarkMode ? "#004d40" : "#e8f5e9",
                  borderColor: isDarkMode ? "#00796b" : "#a5daa5",
                  paddingVertical: touchTarget("paddingV"),
                  minHeight: touchTarget("minHeight"),
                },
              ]}
              onPress={handleExport}
            >
              <FontAwesome6 name="share-from-square" size={fontSize("sm")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
              <Text style={[styles.btnText, { color: isDarkMode ? "#80cbc4" : "#026e02", fontSize: fontSize("sm") }]}>Export Backup</Text>
            </Pressable>

            {/* Import */}
            <Pressable
              style={[
                styles.btn,
                {
                  backgroundColor: isDarkMode ? "#37474f" : "#f5f5f5",
                  borderColor: isDarkMode ? "#455a64" : "#ccc",
                  paddingVertical: touchTarget("paddingV"),
                  minHeight: touchTarget("minHeight"),
                },
              ]}
              onPress={() => setImportModalVisible(true)}
            >
              <FontAwesome6 name="file-import" size={fontSize("sm")} color={isDarkMode ? "#cfd8dc" : "#555"} />
              <Text style={[styles.btnText, { color: isDarkMode ? "#cfd8dc" : "#555", fontSize: fontSize("sm") }]}>Import Backup</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize("lg") }]}>Restore Medication Database</Text>
            <Text style={[styles.settingDesc, { fontSize: fontSize("xs") }]}>Paste your exported JSON backup text string here:</Text>

            <TextInput
              style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder='{"medicines": [...], "history": [...]}'
              placeholderTextColor="#888"
              multiline={true}
              numberOfLines={8}
              value={pastedBackup}
              onChangeText={setPastedBackup}
            />

            <View style={styles.modalButtonRow}>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.cancelBtn,
                  { minHeight: touchTarget("minHeight"), justifyContent: "center" },
                ]}
                onPress={() => {
                  setImportModalVisible(false);
                  setPastedBackup("");
                }}
              >
                <Text style={[styles.cancelBtnText, { fontSize: fontSize("sm") }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.restoreBtn,
                  { minHeight: touchTarget("minHeight"), justifyContent: "center" },
                ]}
                onPress={handleImport}
              >
                <Text style={[styles.restoreBtnText, { fontSize: fontSize("sm") }]}>Restore</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Settings;

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
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  cardTitle: {
    fontFamily: "ComicBold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingLabel: {
    fontFamily: "ComicBold",
  },
  settingDesc: {
    color: "#888",
    marginTop: 2,
  },
  settingDescParagraph: {
    lineHeight: 18,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  btnText: {
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
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontFamily: "ComicBold",
    marginBottom: 5,
  },
  textArea: {
    height: 150,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    marginBottom: 20,
    textAlignVertical: "top",
    fontFamily: "monospace",
    fontSize: 12,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#ccc",
  },
  cancelBtnText: {
    color: "#333",
    fontFamily: "ComicBold",
  },
  restoreBtn: {
    backgroundColor: "#c62828",
  },
  restoreBtnText: {
    color: "white",
    fontFamily: "ComicBold",
  },
});

