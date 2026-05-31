import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { getHistory, clearHistory } from "@/storage/history";
import { IntakeLog } from "@/schemas";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/providers/themeProvider";

const History = () => {
  const router = useRouter();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : useSafeAreaInsets().top;

  const { isDarkMode, theme } = useAppTheme();

  const [logs, setLogs] = useState<IntakeLog[]>([]);

  const fetchHistory = async () => {
    const data = await getHistory();
    setLogs(data);
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
});
