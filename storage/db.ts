import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medicine, IntakeLog } from "../schemas";
import { getBase64FromUri, saveBase64ToAppStorage, clearAllImages } from "../utils/imageStorage";

export const db = SQLite.openDatabaseSync("medtime.db");

// Initialize database tables synchronously
db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency INTEGER NOT NULL,
    timings TEXT NOT NULL,          -- JSON array of strings
    startDate TEXT NOT NULL,        -- ISO string
    endDate TEXT,                  -- ISO string
    stockCount INTEGER NOT NULL,
    taken INTEGER NOT NULL,         -- 0 or 1
    reminder INTEGER NOT NULL,      -- 0 or 1
    missedTimes TEXT,              -- JSON array of strings
    notes TEXT,
    type TEXT NOT NULL,
    patternType TEXT,
    pattern TEXT,                  -- JSON array of numbers or null
    category TEXT,
    imageUrl TEXT,
    lastTaken TEXT,                -- ISO string
    nextDose TEXT,                 -- ISO string
    reminderSound TEXT,
    isArchived INTEGER DEFAULT 0,  -- 0 or 1
    refillThreshold INTEGER,
    notificationTriggerIds TEXT,   -- JSON array of strings
    createdAt TEXT,                -- ISO string
    updatedAt TEXT                 -- ISO string
  );

  CREATE TABLE IF NOT EXISTS history_logs (
    id TEXT PRIMARY KEY NOT NULL,
    medicineId TEXT NOT NULL,
    medicineName TEXT NOT NULL,
    dosage TEXT NOT NULL,
    takenAt TEXT NOT NULL,          -- ISO string
    status TEXT NOT NULL,           -- 'taken' or 'missed'
    notes TEXT
  );
`);

// Safe schema migration to add column snoozedUntil
try {
  db.execSync("ALTER TABLE medicines ADD COLUMN snoozedUntil TEXT;");
} catch (error) {
  // Column already exists, safe to ignore
}

// Model mapping helpers
export function mapRowToMedicine(row: any): Medicine {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    timings: JSON.parse(row.timings),
    startDate: row.startDate,
    endDate: row.endDate || undefined,
    stockCount: row.stockCount,
    taken: row.taken === 1,
    reminder: row.reminder === 1,
    missedTimes: row.missedTimes ? JSON.parse(row.missedTimes) : undefined,
    notes: row.notes || undefined,
    type: row.type,
    patternType: row.patternType || undefined,
    pattern: row.pattern ? JSON.parse(row.pattern) : null,
    category: row.category || undefined,
    imageUrl: row.imageUrl || undefined,
    lastTaken: row.lastTaken || undefined,
    nextDose: row.nextDose || undefined,
    reminderSound: row.reminderSound || undefined,
    isArchived: row.isArchived === 1,
    refillThreshold: row.refillThreshold !== null && row.refillThreshold !== undefined ? row.refillThreshold : undefined,
    notificationTriggerIds: row.notificationTriggerIds ? JSON.parse(row.notificationTriggerIds) : undefined,
    snoozedUntil: row.snoozedUntil || undefined,
    createdAt: row.createdAt || undefined,
    updatedAt: row.updatedAt || undefined,
  };
}

export function mapMedicineToValues(med: Medicine): any[] {
  return [
    med.id,
    med.name,
    med.dosage,
    med.frequency,
    JSON.stringify((med.timings || []).map(t => typeof t === 'string' ? t : t.toISOString())),
    typeof med.startDate === 'string' ? med.startDate : med.startDate.toISOString(),
    med.endDate ? (typeof med.endDate === 'string' ? med.endDate : med.endDate.toISOString()) : null,
    med.stockCount,
    med.taken ? 1 : 0,
    med.reminder ? 1 : 0,
    med.missedTimes ? JSON.stringify(med.missedTimes.map(t => typeof t === 'string' ? t : t.toISOString())) : null,
    med.notes || null,
    med.type,
    med.patternType || null,
    med.pattern ? JSON.stringify(med.pattern) : null,
    med.category || null,
    med.imageUrl || null,
    med.lastTaken ? (typeof med.lastTaken === 'string' ? med.lastTaken : med.lastTaken.toISOString()) : null,
    med.nextDose ? (typeof med.nextDose === 'string' ? med.nextDose : med.nextDose.toISOString()) : null,
    med.reminderSound || null,
    med.isArchived ? 1 : 0,
    med.refillThreshold !== undefined ? med.refillThreshold : null,
    med.notificationTriggerIds ? JSON.stringify(med.notificationTriggerIds) : null,
    med.createdAt ? (typeof med.createdAt === 'string' ? med.createdAt : med.createdAt.toISOString()) : new Date().toISOString(),
    med.updatedAt ? (typeof med.updatedAt === 'string' ? med.updatedAt : med.updatedAt.toISOString()) : new Date().toISOString(),
    med.snoozedUntil ? (typeof med.snoozedUntil === 'string' ? med.snoozedUntil : med.snoozedUntil.toISOString()) : null,
  ];
}

export function mapRowToIntakeLog(row: any): IntakeLog {
  return {
    id: row.id,
    medicineId: row.medicineId,
    medicineName: row.medicineName,
    dosage: row.dosage,
    takenAt: row.takenAt,
    status: row.status as "taken" | "missed",
    notes: row.notes || undefined,
  };
}

// Automatic migration helper from legacy AsyncStorage
export async function migrateFromAsyncStorage() {
  try {
    const medicinesStr = await AsyncStorage.getItem("medicines");
    const historyStr = await AsyncStorage.getItem("history_logs");

    if (medicinesStr) {
      try {
        const medicines: any[] = JSON.parse(medicinesStr);
        const existingMedsCount = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM medicines;");
        if (existingMedsCount && existingMedsCount.count === 0) {
          console.log("Migrating medicines from AsyncStorage to SQLite...");
          for (const med of medicines) {
            const vals = mapMedicineToValues(med);
            await db.runAsync(`
              INSERT OR REPLACE INTO medicines (id, name, dosage, frequency, timings, startDate, endDate, stockCount, taken, reminder, missedTimes, notes, type, patternType, pattern, category, imageUrl, lastTaken, nextDose, reminderSound, isArchived, refillThreshold, notificationTriggerIds, createdAt, updatedAt, snoozedUntil)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, vals);
          }
          console.log("Medicines migration complete successfully.");
        }
      } catch (err) {
        console.error("Failed to parse or migrate medicines:", err);
      }
    }

    if (historyStr) {
      try {
        const history: any[] = JSON.parse(historyStr);
        const existingHistoryCount = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM history_logs;");
        if (existingHistoryCount && existingHistoryCount.count === 0) {
          console.log("Migrating history logs from AsyncStorage to SQLite...");
          for (const log of history) {
            await db.runAsync(`
              INSERT OR REPLACE INTO history_logs (id, medicineId, medicineName, dosage, takenAt, status, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?);
            `, [
              log.id,
              log.medicineId,
              log.medicineName,
              log.dosage,
              typeof log.takenAt === 'string' ? log.takenAt : new Date(log.takenAt).toISOString(),
              log.status,
              log.notes || null
            ]);
          }
          console.log("History logs migration complete successfully.");
        }
      } catch (err) {
        console.error("Failed to parse or migrate history:", err);
      }
    }
  } catch (error) {
    console.error("Migration from AsyncStorage failed:", error);
  }
}

// Backup & Recovery operations
export async function exportBackupData() {
  const medicineRows = await db.getAllAsync("SELECT * FROM medicines;");
  const medicines = medicineRows.map(mapRowToMedicine);

  const historyRows = await db.getAllAsync("SELECT * FROM history_logs ORDER BY takenAt DESC;");
  const history = historyRows.map(mapRowToIntakeLog);

  // Read images and convert to Base64
  const images: { [medId: string]: string } = {};
  for (const med of medicines) {
    if (med.imageUrl) {
      const base64 = await getBase64FromUri(med.imageUrl);
      if (base64) {
        images[med.id] = base64;
      }
    }
  }

  return { medicines, history, images };
}

export async function importBackupData(parsed: { medicines: any[]; history?: any[]; images?: { [medId: string]: string } }) {
  // Clear existing SQLite tables to perform clean restore
  await db.runAsync("DELETE FROM medicines;");
  await db.runAsync("DELETE FROM history_logs;");

  // Wipe all old medication images from app storage to prevent orphaned files
  await clearAllImages();

  // Restore images from Base64
  const imageMap: { [medId: string]: string } = {};
  if (parsed.images) {
    for (const [medId, base64Str] of Object.entries(parsed.images)) {
      const savedUri = await saveBase64ToAppStorage(base64Str, medId);
      if (savedUri) {
        imageMap[medId] = savedUri;
      }
    }
  }

  // Insert medicines
  for (const med of parsed.medicines) {
    // Re-map imageUrl to the restored local file URI
    if (imageMap[med.id]) {
      med.imageUrl = imageMap[med.id];
    } else {
      // Clear the image URL since the image file is no longer available/restored
      med.imageUrl = undefined;
    }
    
    const vals = mapMedicineToValues(med);
    await db.runAsync(`
      INSERT OR REPLACE INTO medicines (id, name, dosage, frequency, timings, startDate, endDate, stockCount, taken, reminder, missedTimes, notes, type, patternType, pattern, category, imageUrl, lastTaken, nextDose, reminderSound, isArchived, refillThreshold, notificationTriggerIds, createdAt, updatedAt, snoozedUntil)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, vals);
  }

  // Insert history logs
  if (parsed.history) {
    for (const log of parsed.history) {
      await db.runAsync(`
        INSERT OR REPLACE INTO history_logs (id, medicineId, medicineName, dosage, takenAt, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [
        log.id,
        log.medicineId,
        log.medicineName,
        log.dosage,
        typeof log.takenAt === 'string' ? log.takenAt : new Date(log.takenAt).toISOString(),
        log.status,
        log.notes || null
      ]);
    }
  }
}
