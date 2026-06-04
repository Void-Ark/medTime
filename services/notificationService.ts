// services/notificationService.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medicine } from "@/schemas";

// Configure how notifications behave when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldBadge: true,
    } as any),
  });
} catch (error) {
  console.warn("Expo Notifications native module not loaded yet. Rebuild the native app to enable lockscreen reminders.", error);
}

/**
 * 1. Request OS Push Notification Permissions
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return false;
  }

  try {
    // Check current permission state
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not granted, request permission
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return false;
    }

    // Android-specific channel configurations
    if (Platform.OS === "android") {
      // Standard channel
      await Notifications.setNotificationChannelAsync("medtime-meds", {
        name: "MedTime Medication Reminders",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#67fc67",
        enableVibrate: true,
        showBadge: true,
      });

      // Loud/Repeating Channel with intense vibration pattern
      await Notifications.setNotificationChannelAsync("medtime-meds-loud", {
        name: "MedTime Medication Alarms (Loud)",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000],
        lightColor: "#ff0000",
        enableVibrate: true,
        showBadge: true,
        bypassDnd: true,
      });
    }

    return true;
  } catch (error) {
    console.error("Error registering push notifications:", error);
    return false;
  }
}

/**
 * 2. Schedule Local Notifications for a Medication
 * Returns an array of scheduled notification trigger IDs
 */
export async function scheduleMedicationNotifications(
  medicine: Medicine
): Promise<{ triggerIds: string[]; nextDose: string | null }> {
  // If reminders are explicitly disabled for this medicine, do not schedule
  if (medicine.reminder === false) return { triggerIds: [], nextDose: null };

  if (medicine.isArchived) return { triggerIds: [], nextDose: null };

  if (medicine.endDate) {
    const today = new Date();
    const end = new Date(medicine.endDate);
    
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    if (todayZero > endZero) {
      return { triggerIds: [], nextDose: null };
    }
    
    if (todayZero.getTime() === endZero.getTime()) {
      // Find latest timing
      const timings = medicine.timings || [];
      if (timings.length > 0) {
        let maxHour = -1;
        let maxMinute = -1;
        timings.forEach((t) => {
          const timeDate = new Date(t);
          const h = timeDate.getHours();
          const m = timeDate.getMinutes();
          if (h > maxHour || (h === maxHour && m > maxMinute)) {
            maxHour = h;
            maxMinute = m;
          }
        });
        
        if (maxHour !== -1) {
          const finalScheduledTime = new Date(
            end.getFullYear(),
            end.getMonth(),
            end.getDate(),
            maxHour,
            maxMinute,
            0,
            0
          );
          
          const windowEnd = finalScheduledTime.getTime() + 60 * 60 * 1000;
          
          // If past final dose window
          if (today.getTime() > windowEnd) {
            return { triggerIds: [], nextDose: null };
          }
          
          // Check if last dose was taken (if lastTaken is within the final scheduled window)
          if (medicine.lastTaken) {
            const lastTakenDate = new Date(medicine.lastTaken);
            const windowStart = finalScheduledTime.getTime() - 60 * 60 * 1000;
            if (lastTakenDate.getTime() >= windowStart && lastTakenDate.getTime() <= windowEnd) {
              return { triggerIds: [], nextDose: null };
            }
          }
        }
      }
    }
  }

  const isEnabled = await registerForPushNotificationsAsync();
  if (!isEnabled) {
    console.log("Push notifications are disabled or unavailable.");
    return { triggerIds: [], nextDose: null };
  }

  const triggerIds: string[] = [];
  const timings = medicine.timings || [];
  if (timings.length === 0) return { triggerIds: [], nextDose: null };

  const now = new Date();
  const lastTakenDate = medicine.lastTaken ? new Date(medicine.lastTaken) : null;

  // 1. Calculate all next occurrences of the timings in the next 24 hours
  const occurrences: Date[] = [];
  
  timings.forEach((t) => {
    const timeDate = new Date(t);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), timeDate.getHours(), timeDate.getMinutes(), 0, 0);
    
    // Check if this timing has already been taken within its active window (T - 1h to T + 1h)
    const isAlreadyTaken = lastTakenDate && 
      lastTakenDate.getTime() >= d.getTime() - 60 * 60 * 1000 &&
      lastTakenDate.getTime() <= d.getTime() + 60 * 60 * 1000;

    // If the window has already expired today (more than 1 hour past the timing) OR if it was already taken, it occurs tomorrow
    if (isAlreadyTaken || (d.getTime() + 60 * 60 * 1000 < now.getTime())) {
      d.setDate(d.getDate() + 1);
    }
    occurrences.push(d);
  });

  // 2. Sort chronologically to find the single next chronological timing window
  occurrences.sort((a, b) => a.getTime() - b.getTime());
  const nextActiveTime = occurrences[0];

  // 3. Define the active window: starts 1 hour before, ends 1 hour after
  const windowStart = new Date(nextActiveTime.getTime() - 60 * 60 * 1000);
  const windowEnd = new Date(nextActiveTime.getTime() + 60 * 60 * 1000);

  // 4. Determine if Loud Alarms are enabled
  const loudAlarmsStr = await AsyncStorage.getItem("loud_alarms_enabled");
  const loudAlarmsEnabled = loudAlarmsStr !== "false"; // Default to true
  const channelId = loudAlarmsEnabled ? "medtime-meds-loud" : "medtime-meds";

  // If loud alarms are enabled: trigger alarm at T, and repeat every 10 minutes (T, T+10, T+20, T+30, T+40, T+50)
  // Otherwise: use standard [T-30, T, T+30]
  const reminderOffsets = loudAlarmsEnabled
    ? [0, 10, 20, 30, 40, 50]
    : [-30, 0, 30];

  const timeStr = nextActiveTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  for (const offsetMin of reminderOffsets) {
    const triggerTime = new Date(nextActiveTime.getTime() + offsetMin * 60 * 1000);
    if (triggerTime > now) {
      const isPreReminder = offsetMin < 0;
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: isPreReminder ? "Upcoming Medication 💊" : "Medication Time! 💊",
            body: isPreReminder
              ? `Reminder: Take ${medicine.name} (${medicine.dosage}) in ${Math.abs(offsetMin)} minutes at ${timeStr}.`
              : `It's time to take your dose of ${medicine.name} (${medicine.dosage}) scheduled for ${timeStr}.`,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { medicineId: medicine.id },
            ...(Platform.OS === "android" && { channelId }),
          },
          trigger: { type: "date", date: triggerTime } as any,
        });
        triggerIds.push(id);
      } catch (err) {
        console.error("Error scheduling reminder:", err);
      }
    }
  }

  // 5. Schedule the final "Missed" notification at T + 60 minutes (windowEnd)
  if (windowEnd > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Missed Medication Alert! ⚠️",
          body: `You missed your dose of ${medicine.name} (${medicine.dosage}) scheduled for ${timeStr} today.`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { medicineId: medicine.id },
          ...(Platform.OS === "android" && { channelId }),
        },
        trigger: { type: "date", date: windowEnd } as any,
      });
      triggerIds.push(id);
    } catch (err) {
      console.error("Error scheduling missed dose warning:", err);
    }
  }

  return { triggerIds, nextDose: nextActiveTime.toISOString() };
}

/**
 * 3. Cancel Specific Scheduled Alarms
 */
export async function cancelScheduledNotifications(triggerIds: string[]) {
  if (!triggerIds || triggerIds.length === 0) return;
  for (const id of triggerIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (err) {
      console.warn(`Failed to cancel notification trigger: ${id}`, err);
    }
  }
}

