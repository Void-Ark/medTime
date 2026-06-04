import * as FileSystem from "expo-file-system";

const IMAGES_DIR = `${FileSystem.documentDirectory}medication_images/`;

/**
 * Ensures that the medication_images/ directory exists in permanent app storage.
 */
async function ensureDirExists(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error("Error creating medication_images directory:", error);
  }
}

/**
 * Copies a temporary picked/taken photo URI to permanent app storage.
 * It deletes any existing image files associated with this medicine ID first.
 * Returns the permanent file URI if successful, or null.
 */
export async function saveImageToAppStorage(tempUri: string, medId: string): Promise<string | null> {
  if (!tempUri) return null;
  // If the image is already in the permanent app storage, no need to copy it again
  if (tempUri.startsWith(IMAGES_DIR)) {
    return tempUri;
  }

  try {
    await ensureDirExists();
    
    // Clean up old image files for this medication to prevent orphaned files
    await cleanOldMedicationImages(medId);

    const timestamp = Date.now();
    const fileExtension = tempUri.split(".").pop() || "jpg";
    const destUri = `${IMAGES_DIR}med_${medId}_${timestamp}.${fileExtension}`;

    await FileSystem.copyAsync({
      from: tempUri,
      to: destUri,
    });

    console.log("Successfully saved image permanently:", destUri);
    return destUri;
  } catch (error) {
    console.error("Failed to copy image to permanent app storage:", error);
    return null;
  }
}

/**
 * Deletes any existing image files in app storage starting with "med_[medId]_".
 */
export async function cleanOldMedicationImages(medId: string): Promise<void> {
  try {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    const targetPrefix = `med_${medId}_`;
    
    for (const file of files) {
      if (file.startsWith(targetPrefix)) {
        const fileUri = `${IMAGES_DIR}${file}`;
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        console.log("Deleted old medication image file:", fileUri);
      }
    }
  } catch (error) {
    console.error("Error cleaning up old medication images:", error);
  }
}

/**
 * Deletes a specific image file from the app storage.
 */
export async function deleteImageFromAppStorage(fileUri: string | null | undefined): Promise<void> {
  if (!fileUri) return;
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log("Deleted image from app storage:", fileUri);
    }
  } catch (error) {
    console.error("Error deleting image file:", error);
  }
}

/**
 * Reads a local file and returns its Base64 encoded string.
 */
export async function getBase64FromUri(fileUri: string): Promise<string | null> {
  if (!fileUri) return null;
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      console.warn("File does not exist for base64 conversion:", fileUri);
      return null;
    }
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("Error reading file as Base64:", error);
    return null;
  }
}

/**
 * Writes a Base64 string back to permanent app storage.
 * Returns the permanent file URI if successful, or null.
 */
export async function saveBase64ToAppStorage(base64Str: string, medId: string): Promise<string | null> {
  if (!base64Str) return null;
  try {
    await ensureDirExists();
    await cleanOldMedicationImages(medId);

    const timestamp = Date.now();
    const destUri = `${IMAGES_DIR}med_${medId}_${timestamp}.jpg`;

    await FileSystem.writeAsStringAsync(destUri, base64Str, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("Successfully saved base64 string to app storage:", destUri);
    return destUri;
  } catch (error) {
    console.error("Failed to save base64 string to app storage:", error);
    return null;
  }
}

/**
 * Wipes out all stored medication images in the permanent app storage.
 */
export async function clearAllImages(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(IMAGES_DIR, { idempotent: true });
      console.log("Cleared all medication images from app storage.");
    }
  } catch (error) {
    console.error("Error clearing all medication images:", error);
  }
}
