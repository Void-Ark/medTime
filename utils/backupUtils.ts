import * as FileSystem from "expo-file-system";
import { zip, unzip } from "react-native-zip-archive";
import { Share } from "react-native";
import {
  db,
  mapRowToMedicine,
  mapRowToIntakeLog,
  mapMedicineToValues,
  importBackupData,
} from "../storage/db";
import { clearAllImages } from "./imageStorage";

// ─── Paths ────────────────────────────────────────────────────────────────────

const PERM_IMAGES_DIR = `${FileSystem.documentDirectory}medication_images/`;
const TEMP_EXPORT_DIR = `${FileSystem.cacheDirectory}medtime_export/`;
const TEMP_IMPORT_DIR = `${FileSystem.cacheDirectory}medtime_import/`;

/**
 * react-native-zip-archive requires plain filesystem paths (no file:// prefix).
 * Also strip trailing slash since zip() is fussy about it on some platforms.
 */
function toFsPath(uri: string): string {
  return uri.replace(/^file:\/\//, "").replace(/\/$/, "");
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Builds a .zip archive:
 *   medtime-backup-<timestamp>.zip
 *   ├── data.json          ← medicines + history (imageUrl = filename only)
 *   └── images/
 *       ├── med_abc_1234.jpg
 *       └── ...
 *
 * Then opens the native share sheet with the file.
 * Images stay as real files — no Base64 bloat, scales to 1000+ images.
 */
export async function exportAsZip(): Promise<void> {
  // 1. Clean temp export workspace
  await FileSystem.deleteAsync(TEMP_EXPORT_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(`${TEMP_EXPORT_DIR}images/`, {
    intermediates: true,
  });

  // 2. Read DB
  const medicineRows = await db.getAllAsync("SELECT * FROM medicines;");
  const medicines = medicineRows.map(mapRowToMedicine);

  const historyRows = await db.getAllAsync(
    "SELECT * FROM history_logs ORDER BY takenAt DESC;"
  );
  const history = historyRows.map(mapRowToIntakeLog);

  // 3. Copy images into the temp images/ folder; record filename per medId
  const imageFilenameMap: Record<string, string> = {};

  for (const med of medicines) {
    if (!med.imageUrl) continue;

    const info = await FileSystem.getInfoAsync(med.imageUrl);
    if (!info.exists) continue;

    // Preserve original filename so re-import is deterministic
    const filename =
      med.imageUrl.split("/").pop() || `med_${med.id}_${Date.now()}.jpg`;

    await FileSystem.copyAsync({
      from: med.imageUrl,
      to: `${TEMP_EXPORT_DIR}images/${filename}`,
    });

    imageFilenameMap[med.id] = filename;
  }

  // 4. Build export medicines list — imageUrl is just the filename (not full path)
  const exportMedicines = medicines.map((med) => ({
    ...med,
    imageUrl: imageFilenameMap[med.id] ?? undefined,
  }));

  // 5. Write data.json
  const dataJson = JSON.stringify({
    medicines: exportMedicines,
    history,
    version: "2.0",
    exportedAt: new Date().toISOString(),
  });

  await FileSystem.writeAsStringAsync(`${TEMP_EXPORT_DIR}data.json`, dataJson, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // 6. Zip the export folder → single .zip file in cache
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const zipName = `medtime-backup-${timestamp}.zip`;
  const zipFsPath = toFsPath(`${FileSystem.cacheDirectory}${zipName}`);

  await zip(toFsPath(TEMP_EXPORT_DIR), zipFsPath);

  // 7. Cleanup temp workspace
  await FileSystem.deleteAsync(TEMP_EXPORT_DIR, { idempotent: true });

  // 8. Share the zip as a real file
  await Share.share({
    url: `file://${zipFsPath}`,
    title: "MedTime Backup",
    message:
      "MedTime backup — import this file in the app to restore all your data and images.",
  });
}

// ─── Peek (for confirmation dialog) ──────────────────────────────────────────

export interface BackupPeek {
  medicineCount: number;
  imageCount: number;
  /** "zip" = new format, "json" = legacy Base64 format */
  format: "zip" | "json";
}

/**
 * Reads just enough of a backup file to show the user a confirmation summary.
 * For ZIP: extracts to temp, reads data.json, then removes temp dir.
 * For JSON: reads and parses (legacy v1 Base64 format).
 */
export async function peekBackup(
  fileUri: string,
  fileName: string
): Promise<BackupPeek> {
  const isZip =
    fileName.toLowerCase().endsWith(".zip") ||
    (!fileName.toLowerCase().endsWith(".json") &&
      (await isZipFile(fileUri)));

  if (isZip) {
    return await peekZip(fileUri);
  } else {
    return await peekJson(fileUri);
  }
}

async function peekZip(fileUri: string): Promise<BackupPeek> {
  await FileSystem.deleteAsync(TEMP_IMPORT_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(TEMP_IMPORT_DIR, { intermediates: true });

  await unzip(toFsPath(fileUri), toFsPath(TEMP_IMPORT_DIR));

  const dataJsonPath = await resolveDataJsonPath(TEMP_IMPORT_DIR);
  const content = await FileSystem.readAsStringAsync(dataJsonPath, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = JSON.parse(content);

  const medicineCount = Array.isArray(parsed.medicines)
    ? parsed.medicines.length
    : 0;

  // Count image files that actually exist in the images/ folder
  const imagesDir = await resolveImagesDirPath(TEMP_IMPORT_DIR);
  let imageCount = 0;
  if (imagesDir) {
    const files = await FileSystem.readDirectoryAsync(imagesDir);
    imageCount = files.length;
  }

  // Keep temp dir alive — restoreZip() will reuse it if called immediately after
  return { medicineCount, imageCount, format: "zip" };
}

async function peekJson(fileUri: string): Promise<BackupPeek> {
  const content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.medicines)) {
    throw new Error("Invalid backup: medicines array not found");
  }

  const medicineCount = parsed.medicines.length;
  const imageCount = parsed.images ? Object.keys(parsed.images).length : 0;

  return { medicineCount, imageCount, format: "json" };
}

// ─── Restore ──────────────────────────────────────────────────────────────────

/**
 * Full restore. Supports:
 *   - New .zip format (v2.0)  ← primary
 *   - Old .json Base64 format (v1.0)  ← backward compat
 */
export async function restoreBackup(
  fileUri: string,
  fileName: string
): Promise<{ medicines: number; images: number }> {
  const isZip =
    fileName.toLowerCase().endsWith(".zip") ||
    (!fileName.toLowerCase().endsWith(".json") &&
      (await isZipFile(fileUri)));

  if (isZip) {
    return await restoreZip(fileUri);
  } else {
    return await restoreJson(fileUri);
  }
}

async function restoreZip(
  fileUri: string
): Promise<{ medicines: number; images: number }> {
  // If peekZip() already ran and left the temp dir, reuse it; otherwise re-extract.
  const tempDirInfo = await FileSystem.getInfoAsync(TEMP_IMPORT_DIR);
  if (!tempDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TEMP_IMPORT_DIR, {
      intermediates: true,
    });
    await unzip(toFsPath(fileUri), toFsPath(TEMP_IMPORT_DIR));
  }

  try {
    // Read data.json
    const dataJsonPath = await resolveDataJsonPath(TEMP_IMPORT_DIR);
    const content = await FileSystem.readAsStringAsync(dataJsonPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed.medicines)) {
      throw new Error("Invalid backup: medicines array missing");
    }

    // Clear existing data
    await db.runAsync("DELETE FROM medicines;");
    await db.runAsync("DELETE FROM history_logs;");
    await clearAllImages();

    // Ensure permanent images dir exists
    await FileSystem.makeDirectoryAsync(PERM_IMAGES_DIR, {
      intermediates: true,
    });

    // Restore images: copy from zip's images/ to permanent storage
    const imagesDir = await resolveImagesDirPath(TEMP_IMPORT_DIR);
    let imageCount = 0;
    const imageUrlMap: Record<string, string> = {};

    for (const med of parsed.medicines) {
      if (!med.imageUrl) continue;
      if (!imagesDir) continue;

      const srcUri = `${imagesDir}${med.imageUrl}`;
      const srcInfo = await FileSystem.getInfoAsync(srcUri);
      if (!srcInfo.exists) continue;

      const destUri = `${PERM_IMAGES_DIR}${med.imageUrl}`;
      await FileSystem.copyAsync({ from: srcUri, to: destUri });
      imageUrlMap[med.id] = destUri;
      imageCount++;
    }

    // Insert medicines with updated full imageUrls
    for (const med of parsed.medicines) {
      med.imageUrl = imageUrlMap[med.id] ?? undefined;
      const vals = mapMedicineToValues(med);
      await db.runAsync(
        `INSERT OR REPLACE INTO medicines (id, name, dosage, frequency, timings, startDate, endDate, stockCount, taken, reminder, missedTimes, notes, type, patternType, pattern, category, imageUrl, lastTaken, nextDose, reminderSound, isArchived, refillThreshold, notificationTriggerIds, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        vals
      );
    }

    // Insert history logs
    if (Array.isArray(parsed.history)) {
      for (const log of parsed.history) {
        await db.runAsync(
          `INSERT OR REPLACE INTO history_logs (id, medicineId, medicineName, dosage, takenAt, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            log.id,
            log.medicineId,
            log.medicineName,
            log.dosage,
            typeof log.takenAt === "string"
              ? log.takenAt
              : new Date(log.takenAt).toISOString(),
            log.status,
            log.notes || null,
          ]
        );
      }
    }

    return { medicines: parsed.medicines.length, images: imageCount };
  } finally {
    // Always cleanup temp dir
    await FileSystem.deleteAsync(TEMP_IMPORT_DIR, { idempotent: true });
  }
}

async function restoreJson(
  fileUri: string
): Promise<{ medicines: number; images: number }> {
  const content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.medicines)) {
    throw new Error("Invalid backup: medicines array missing");
  }

  // Delegate to existing Base64-aware import function
  await importBackupData(parsed);

  const imageCount = parsed.images ? Object.keys(parsed.images).length : 0;
  return { medicines: parsed.medicines.length, images: imageCount };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sniff the first 4 bytes of a file to check for PK (ZIP magic bytes).
 */
async function isZipFile(fileUri: string): Promise<boolean> {
  try {
    // Read a tiny slice as base64 and check for ZIP signature (PK = 0x504B)
    const snippet = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      length: 4,
      position: 0,
    } as any);
    // Base64 of "PK\x03\x04" starts with "UEs"
    return snippet.startsWith("UEs");
  } catch {
    return false;
  }
}

/**
 * After unzipping, find where data.json landed.
 * react-native-zip-archive may put it at root or inside a subdirectory.
 */
async function resolveDataJsonPath(extractDir: string): Promise<string> {
  // Case 1: flat — extractDir/data.json
  const flat = `${extractDir}data.json`;
  const flatInfo = await FileSystem.getInfoAsync(flat);
  if (flatInfo.exists) return flat;

  // Case 2: nested — extractDir/<subfolder>/data.json
  const entries = await FileSystem.readDirectoryAsync(extractDir);
  for (const entry of entries) {
    const nested = `${extractDir}${entry}/data.json`;
    const nestedInfo = await FileSystem.getInfoAsync(nested);
    if (nestedInfo.exists) return nested;
  }

  throw new Error("data.json not found in backup archive");
}

/**
 * Find the images/ directory inside the extracted archive.
 */
async function resolveImagesDirPath(
  extractDir: string
): Promise<string | null> {
  // Case 1: flat — extractDir/images/
  const flat = `${extractDir}images/`;
  const flatInfo = await FileSystem.getInfoAsync(flat);
  if (flatInfo.exists) return flat;

  // Case 2: nested — extractDir/<subfolder>/images/
  const entries = await FileSystem.readDirectoryAsync(extractDir);
  for (const entry of entries) {
    const nested = `${extractDir}${entry}/images/`;
    const nestedInfo = await FileSystem.getInfoAsync(nested);
    if (nestedInfo.exists) return nested;
  }

  return null;
}
