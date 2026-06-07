import { IntakeLog } from "../schemas";
import { db, mapRowToIntakeLog } from "./db";

export async function getHistory(): Promise<IntakeLog[]> {
  try {
    const rows = await db.getAllAsync("SELECT * FROM history_logs ORDER BY takenAt DESC;");
    return rows.map(mapRowToIntakeLog);
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

export async function addHistoryEntry(log: IntakeLog): Promise<boolean> {
  try {
    await db.runAsync(`
      INSERT OR REPLACE INTO history_logs (id, medicineId, medicineName, dosage, takenAt, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `, [
      log.id,
      log.medicineId,
      log.medicineName,
      log.dosage,
      typeof log.takenAt === 'string' ? log.takenAt : log.takenAt.toISOString(),
      log.status,
      log.notes || null
    ]);
    return true;
  } catch (error) {
    console.error("Error adding history entry:", error);
    return false;
  }
}

export async function deleteHistoryEntries(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const placeholders = ids.map(() => "?").join(", ");
    await db.runAsync(`DELETE FROM history_logs WHERE id IN (${placeholders});`, ids);
    return true;
  } catch (error) {
    console.error("Error deleting history entries:", error);
    return false;
  }
}

export async function clearHistory(): Promise<boolean> {
  try {
    await db.runAsync("DELETE FROM history_logs;");
    return true;
  } catch (error) {
    console.error("Error clearing history:", error);
    return false;
  }
}
