import AsyncStorage from "@react-native-async-storage/async-storage";
import { IntakeLog } from "../schemas";

const HISTORY_KEY = "history_logs";

export async function getHistory(): Promise<IntakeLog[]> {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    const parsed: IntakeLog[] = stored ? JSON.parse(stored) : [];
    // Sort in reverse chronological order (newest first)
    return parsed.sort((a, b) => {
      const timeA = new Date(a.takenAt).getTime();
      const timeB = new Date(b.takenAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

export async function addHistoryEntry(log: IntakeLog): Promise<boolean> {
  try {
    const history = await getHistory();
    history.unshift(log); // Prepend to history logs
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error("Error adding history entry:", error);
    return false;
  }
}

export async function clearHistory(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing history:", error);
    return false;
  }
}
