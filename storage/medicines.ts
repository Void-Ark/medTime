import { Medicine, MedicineType, MedicinePatternType, IntakeLog } from "../schemas";
import { db, mapRowToMedicine, mapMedicineToValues } from "./db";
import { addHistoryEntry } from "./history";
import {
  scheduleMedicationNotifications,
  cancelScheduledNotifications,
  scheduleSnoozedNotification,
} from "../services/notificationService";
import { deleteImageFromAppStorage } from "../utils/imageStorage";

// Re-export types for backward compatibility
export { Medicine, MedicineType, MedicinePatternType };

export async function addMedicine(newMedicine: Medicine): Promise<boolean> {
  try {
    // Schedule push notification triggers for the new medicine
    const { triggerIds, nextDose } = await scheduleMedicationNotifications(newMedicine);
    const medWithTriggers = { 
      ...newMedicine, 
      notificationTriggerIds: triggerIds,
      nextDose: nextDose || undefined,
    };

    const vals = mapMedicineToValues(medWithTriggers);
    await db.runAsync(`
      INSERT OR REPLACE INTO medicines (id, name, dosage, frequency, timings, startDate, endDate, stockCount, taken, reminder, missedTimes, notes, type, patternType, pattern, category, imageUrl, lastTaken, nextDose, reminderSound, isArchived, refillThreshold, notificationTriggerIds, createdAt, updatedAt, snoozedUntil)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, vals);
    return true;
  } catch (error) {
    console.error("Error adding medicine", error);
    return false;
  }
}

export async function getMedicines(): Promise<Medicine[]> {
  try {
    const rows = await db.getAllAsync("SELECT * FROM medicines;");
    const storedMedicinesJSON = rows.map(mapRowToMedicine);

    // Background sync: automatically reschedule expired notifications / missing nextDose
    const now = new Date();
    let needsSave = false;
    const updatedMedicines: Medicine[] = [];

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
          const updated = {
            ...med,
            notificationTriggerIds: triggerIds,
            nextDose: nextDose || undefined,
          };
          storedMedicinesJSON[i] = updated;
          updatedMedicines.push(updated);
          needsSave = true;
        }
      }
    }

    if (needsSave) {
      for (const updatedMed of updatedMedicines) {
        await db.runAsync(`
          UPDATE medicines SET 
            notificationTriggerIds = ?, 
            nextDose = ? 
          WHERE id = ?;
        `, [
          updatedMed.notificationTriggerIds ? JSON.stringify(updatedMed.notificationTriggerIds) : null,
          updatedMed.nextDose ? (typeof updatedMed.nextDose === 'string' ? updatedMed.nextDose : updatedMed.nextDose.toISOString()) : null,
          updatedMed.id
        ]);
      }
    }

    return storedMedicinesJSON;
  } catch (error) {
    console.error("Error retrieving medicines", error);
    return [];
  }
}

export async function removeMedicine(id: string): Promise<boolean> {
  try {
    const row = await db.getFirstAsync("SELECT * FROM medicines WHERE id = ?;", [id]);
    if (row) {
      const existing = mapRowToMedicine(row);
      // Cancel all scheduled notifications for the deleted medicine
      if (existing.notificationTriggerIds) {
        await cancelScheduledNotifications(existing.notificationTriggerIds);
      }
      // Delete associated image file from app storage
      if (existing.imageUrl) {
        await deleteImageFromAppStorage(existing.imageUrl);
      }
      await db.runAsync("DELETE FROM medicines WHERE id = ?;", [id]);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error removing medicine", error);
    return false;
  }
}

export async function markAsTaken(id: string): Promise<boolean> {
  try {
    const row = await db.getFirstAsync("SELECT * FROM medicines WHERE id = ?;", [id]);
    if (!row) return false;

    const medicineToMark = mapRowToMedicine(row);
    const newStock = medicineToMark.stockCount > 0 ? medicineToMark.stockCount - 1 : 0;
    const takenDate = new Date();

    // 1. Cancel previous notifications for this active window
    if (medicineToMark.notificationTriggerIds) {
      await cancelScheduledNotifications(medicineToMark.notificationTriggerIds);
    }

    // Create a temporary object for rescheduling logic
    const tempMed = {
      ...medicineToMark,
      taken: true,
      stockCount: newStock,
      lastTaken: takenDate.toISOString(),
    };

    // 2. Schedule push notifications for the *next* chronological timings window
    const { triggerIds: newTriggerIds, nextDose: newNextDose } = await scheduleMedicationNotifications(tempMed);

    // 3. Save the new trigger IDs, nextDose, taken, stockCount, and lastTaken back to SQLite
    await db.runAsync(`
      UPDATE medicines SET 
        taken = 1, 
        stockCount = ?, 
        lastTaken = ?, 
        notificationTriggerIds = ?, 
        nextDose = ?,
        snoozedUntil = NULL
      WHERE id = ?;
    `, [
      newStock, 
      takenDate.toISOString(), 
      newTriggerIds ? JSON.stringify(newTriggerIds) : null,
      newNextDose || null,
      id
    ]);

    // 4. Append to intake history logs
    const log: IntakeLog = {
      id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
      medicineId: id,
      medicineName: medicineToMark.name,
      dosage: medicineToMark.dosage,
      takenAt: takenDate.toISOString(),
      status: "taken",
    };
    await addHistoryEntry(log);

    return true;
  } catch (error) {
    console.error("Error marking medicine as taken:", error);
    return false;
  }
}

export async function updateMedicine(updatedMed: Medicine): Promise<boolean> {
  try {
    // Cancel old alarms before scheduling new ones
    const row = await db.getFirstAsync("SELECT * FROM medicines WHERE id = ?;", [updatedMed.id]);
    if (row) {
      const existing = mapRowToMedicine(row);
      if (existing.notificationTriggerIds) {
        await cancelScheduledNotifications(existing.notificationTriggerIds);
      }
    }

    // Schedule new alarms and get fresh trigger IDs and nextDose
    const { triggerIds: newTriggerIds, nextDose: newNextDose } = await scheduleMedicationNotifications(updatedMed);
    const medWithNewTriggers = { 
      ...updatedMed, 
      notificationTriggerIds: newTriggerIds,
      nextDose: newNextDose || undefined,
    };

    const vals = mapMedicineToValues(medWithNewTriggers);
    await db.runAsync(`
      INSERT OR REPLACE INTO medicines (id, name, dosage, frequency, timings, startDate, endDate, stockCount, taken, reminder, missedTimes, notes, type, patternType, pattern, category, imageUrl, lastTaken, nextDose, reminderSound, isArchived, refillThreshold, notificationTriggerIds, createdAt, updatedAt, snoozedUntil)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, vals);

    return true;
  } catch (error) {
    console.error("Error updating medicine", error);
    return false;
  }
}

export async function refillMedicineStock(id: string, refillAmount: number): Promise<boolean> {
  try {
    const row = await db.getFirstAsync("SELECT stockCount FROM medicines WHERE id = ?;", [id]);
    if (!row) return false;
    const currentStock = (row as any).stockCount || 0;
    const newStock = currentStock + refillAmount;
    await db.runAsync("UPDATE medicines SET stockCount = ?, updatedAt = ? WHERE id = ?;", [
      newStock,
      new Date().toISOString(),
      id
    ]);
    return true;
  } catch (error) {
    console.error("Error refilling medicine stock:", error);
    return false;
  }
}

export async function updateMedicineStock(id: string, newStock: number): Promise<boolean> {
  try {
    await db.runAsync("UPDATE medicines SET stockCount = ?, updatedAt = ? WHERE id = ?;", [
      newStock,
      new Date().toISOString(),
      id
    ]);
    return true;
  } catch (error) {
    console.error("Error updating medicine stock count:", error);
    return false;
  }
}

export async function snoozeMedicine(id: string, minutes: number): Promise<boolean> {
  try {
    const row = await db.getFirstAsync("SELECT * FROM medicines WHERE id = ?;", [id]);
    if (!row) return false;

    const medicineToSnooze = mapRowToMedicine(row);

    // 1. Cancel previous notifications
    if (medicineToSnooze.notificationTriggerIds) {
      await cancelScheduledNotifications(medicineToSnooze.notificationTriggerIds);
    }

    // 2. Schedule snoozed notification
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    const newTriggerIds = await scheduleSnoozedNotification(medicineToSnooze, snoozeTime);

    // 3. Save to database
    await db.runAsync(`
      UPDATE medicines SET
        snoozedUntil = ?,
        notificationTriggerIds = ?
      WHERE id = ?;
    `, [
      snoozeTime.toISOString(),
      newTriggerIds ? JSON.stringify(newTriggerIds) : null,
      id
    ]);

    return true;
  } catch (error) {
    console.error("Error snoozing medicine:", error);
    return false;
  }
}

