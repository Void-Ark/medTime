import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medicine, MedicineType, MedicinePatternType, IntakeLog } from "../schemas";
import { addHistoryEntry } from "./history";
import {
  scheduleMedicationNotifications,
  cancelScheduledNotifications,
} from "../services/notificationService";

// Re-export types for backward compatibility
export { Medicine, MedicineType, MedicinePatternType };

const KEY = "medicines";

export async function addMedicine(newMedicine: Medicine): Promise<boolean> {
  try {
    // Schedule push notification triggers for the new medicine
    const { triggerIds, nextDose } = await scheduleMedicationNotifications(newMedicine);
    const medWithTriggers = { 
      ...newMedicine, 
      notificationTriggerIds: triggerIds,
      nextDose: nextDose || undefined,
    };

    const storedMedicines = await AsyncStorage.getItem(KEY);
    const storedMedicinesJSON: Medicine[] = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];
    storedMedicinesJSON.push(medWithTriggers);
    await AsyncStorage.setItem(KEY, JSON.stringify(storedMedicinesJSON));
    return true;
  } catch (error) {
    console.error("Error adding medicine", error);
    return false;
  }
}

export async function getMedicines(): Promise<Medicine[]> {
  try {
    const storedMedicines = await AsyncStorage.getItem(KEY);
    let storedMedicinesJSON: Medicine[] = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];

    // Background sync: automatically reschedule expired notifications / missing nextDose
    const now = new Date();
    let needsSave = false;

    for (let i = 0; i < storedMedicinesJSON.length; i++) {
      const med = storedMedicinesJSON[i];
      if (med.reminder) {
        let isExpired = false;
        if (med.nextDose) {
          const nextDoseDate = new Date(med.nextDose);
          const windowEnd = new Date(nextDoseDate.getTime() + 60 * 60 * 1000);
          isExpired = now > windowEnd;
        }

        if (!med.nextDose || isExpired) {
          // Expired or missing nextDose: cancel old triggers and schedule next window
          if (med.notificationTriggerIds) {
            await cancelScheduledNotifications(med.notificationTriggerIds);
          }
          const { triggerIds, nextDose } = await scheduleMedicationNotifications(med);
          storedMedicinesJSON[i] = {
            ...med,
            notificationTriggerIds: triggerIds,
            nextDose: nextDose || undefined,
          };
          needsSave = true;
        }
      }
    }

    if (needsSave) {
      await AsyncStorage.setItem(KEY, JSON.stringify(storedMedicinesJSON));
    }

    return storedMedicinesJSON;
  } catch (error) {
    console.error("Error retrieving medicines", error);
    return [];
  }
}

export async function removeMedicine(id: string): Promise<boolean> {
  try {
    const storedMedicines = await AsyncStorage.getItem(KEY);
    const storedMedicinesJSON: Medicine[] = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];

    // Cancel all scheduled notifications for the deleted medicine
    const existing = storedMedicinesJSON.find((m) => m.id === id);
    if (existing && existing.notificationTriggerIds) {
      await cancelScheduledNotifications(existing.notificationTriggerIds);
    }

    const newMedicines = storedMedicinesJSON.filter(
      (medicine: Medicine) => medicine.id !== id
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(newMedicines));
    return true;
  } catch (error) {
    console.error("Error removing medicine", error);
    return false;
  }
}

export async function markAsTaken(id: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    let medicines: Medicine[] = stored ? JSON.parse(stored) : [];

    let medicineToMark: Medicine | undefined;

    medicines = medicines.map((m) => {
      if (m.id === id) {
        medicineToMark = m;
        const newStock = m.stockCount > 0 ? m.stockCount - 1 : 0;
        return {
          ...m,
          taken: true,
          stockCount: newStock,
          lastTaken: new Date(),
        };
      }
      return m;
    });

    if (medicineToMark) {
      // 1. Cancel previous notifications for this active window
      if (medicineToMark.notificationTriggerIds) {
        await cancelScheduledNotifications(medicineToMark.notificationTriggerIds);
      }

      // 2. Schedule push notifications for the *next* chronological timings window
      const { triggerIds: newTriggerIds, nextDose: newNextDose } = await scheduleMedicationNotifications(medicineToMark);

      // Save the new trigger IDs and nextDose back to our array
      medicines = medicines.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            notificationTriggerIds: newTriggerIds,
            nextDose: newNextDose || undefined,
          };
        }
        return m;
      });
    }

    await AsyncStorage.setItem(KEY, JSON.stringify(medicines));

    // If medicine was found, append to intake history logs
    if (medicineToMark) {
      const log: IntakeLog = {
        id: Math.random().toString(36).substring(7),
        medicineId: id,
        medicineName: medicineToMark.name,
        dosage: medicineToMark.dosage,
        takenAt: new Date(),
        status: "taken",
      };
      await addHistoryEntry(log);
    }
    return true;
  } catch (error) {
    console.error("Error marking medicine as taken:", error);
    return false;
  }
}

export async function updateMedicine(updatedMed: Medicine): Promise<boolean> {
  try {
    const storedMedicines = await AsyncStorage.getItem(KEY);
    let storedMedicinesJSON: Medicine[] = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];

    // Cancel old alarms before scheduling new ones
    const existing = storedMedicinesJSON.find((m) => m.id === updatedMed.id);
    if (existing && existing.notificationTriggerIds) {
      await cancelScheduledNotifications(existing.notificationTriggerIds);
    }

    // Schedule new alarms and get fresh trigger IDs and nextDose
    const { triggerIds: newTriggerIds, nextDose: newNextDose } = await scheduleMedicationNotifications(updatedMed);
    const medWithNewTriggers = { 
      ...updatedMed, 
      notificationTriggerIds: newTriggerIds,
      nextDose: newNextDose || undefined,
    };

    storedMedicinesJSON = storedMedicinesJSON.map((m) =>
      m.id === updatedMed.id ? medWithNewTriggers : m
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(storedMedicinesJSON));
    return true;
  } catch (error) {
    console.error("Error updating medicine", error);
    return false;
  }
}
