import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Switch,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
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
import { exportAsZip, peekBackup, restoreBackup } from "@/utils/backupUtils";

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
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

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

  // Export: build a .zip archive (data.json + images/) and open native share sheet
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportAsZip();
    } catch (error) {
      console.error("Error exporting backup:", error);
      Alert.alert("Export Failed", "Could not create the backup archive. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Import: pick a .zip (new) or .json (legacy) backup, peek at contents, confirm, restore
  const handleImport = async () => {
    if (isImporting) return;

    // Step 1 — let the user pick the file
    let pickerResult: DocumentPicker.DocumentPickerResult;
    try {
      pickerResult = await DocumentPicker.getDocumentAsync({
        // Accept zip + json; "*/*" as fallback for Android
        type: ["application/zip", "application/json", "*/*"],
        copyToCacheDirectory: true,
      });
    } catch (e) {
      console.error("DocumentPicker error:", e);
      return;
    }

    if (pickerResult.canceled || !pickerResult.assets?.length) return;

    const { uri: fileUri, name: fileName = "" } = pickerResult.assets[0];

    // Step 2 — peek at the file to build a confirmation message
    setIsImporting(true);
    let peek;
    try {
      peek = await peekBackup(fileUri, fileName);
    } catch (e: any) {
      console.error("Peek error:", e);
      Alert.alert(
        "Unreadable File",
        "Could not read the selected file. Make sure it is a valid MedTime backup (.zip or .json)."
      );
      setIsImporting(false);
      return;
    }

    const formatLabel = peek.format === "zip" ? "ZIP archive" : "JSON backup (legacy)";
    const imageLabel = peek.imageCount > 0 ? ` and ${peek.imageCount} image(s)` : "";

    // Step 3 — confirm with the user
    Alert.alert(
      "Confirm Restore",
      `Found ${peek.medicineCount} medication(s)${imageLabel} in this ${formatLabel}.\n\nRestoring will replace ALL current data. This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsImporting(false),
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await restoreBackup(fileUri, fileName);
              Alert.alert(
                "✅ Restored!",
                `Successfully restored ${result.medicines} medication(s)${
                  result.images > 0 ? ` with ${result.images} image(s)` : ""
                }.`
              );
            } catch (err: any) {
              console.error("Restore error:", err);
              Alert.alert("Restore Failed", err?.message || "An unexpected error occurred.");
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
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
            Export a <Text style={{ fontFamily: "ComicBold" }}>.zip</Text> archive containing your medications, history, and all images as real files — no Base64 bloat. AirDrop it or save to iCloud, then import on your new phone. Also accepts old .json backups.
          </Text>

          <View style={styles.buttonRow}>
            {/* Export */}
            <Pressable
              style={[
                styles.btn,
                {
                  backgroundColor: isExporting
                    ? (isDarkMode ? "#00332b" : "#c8e6c9")
                    : (isDarkMode ? "#004d40" : "#e8f5e9"),
                  borderColor: isDarkMode ? "#00796b" : "#a5daa5",
                  paddingVertical: touchTarget("paddingV"),
                  minHeight: touchTarget("minHeight"),
                  opacity: isExporting ? 0.7 : 1,
                },
              ]}
              onPress={handleExport}
              disabled={isExporting}
            >
              <FontAwesome6 name="share-from-square" size={fontSize("sm")} color={isDarkMode ? "#80cbc4" : "#026e02"} />
              <Text style={[styles.btnText, { color: isDarkMode ? "#80cbc4" : "#026e02", fontSize: fontSize("sm") }]}>
                {isExporting ? "Preparing..." : "Export Backup"}
              </Text>
            </Pressable>

            {/* Import */}
            <Pressable
              style={[
                styles.btn,
                {
                  backgroundColor: isImporting
                    ? (isDarkMode ? "#263238" : "#e0e0e0")
                    : (isDarkMode ? "#37474f" : "#f5f5f5"),
                  borderColor: isDarkMode ? "#455a64" : "#ccc",
                  paddingVertical: touchTarget("paddingV"),
                  minHeight: touchTarget("minHeight"),
                  opacity: isImporting ? 0.7 : 1,
                },
              ]}
              onPress={handleImport}
              disabled={isImporting}
            >
              <FontAwesome6 name="file-import" size={fontSize("sm")} color={isDarkMode ? "#cfd8dc" : "#555"} />
              <Text style={[styles.btnText, { color: isDarkMode ? "#cfd8dc" : "#555", fontSize: fontSize("sm") }]}>
                {isImporting ? "Restoring..." : "Import Backup"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
});

