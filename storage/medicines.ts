import AsyncStorage from "@react-native-async-storage/async-storage";

// Type defining the schedule pattern of the medicine
export type MedicineType =
  | "pill" // Pill form
  | "liquid" // Liquid form
  | "injection" // Injection form
  | "ointment" // Ointment form
  | "supplement" // Supplement form
  | "other"; // Other form

export type MedicinePatternType =
  | "daily" // taken every day
  | "weekly" // taken specific days of the week
  | "monthly" // taken specific day(s) of the month
  | "asNeeded" // taken as needed (PRN)
  | "yearly" // taken once a year
  | "custom"; // custom schedule not covered by other types

// export type MedicineType = "pill" | "liquid" | "injection" | "ointment" | "supplement";

export interface Medicine {
  id: string; // Unique identifier for the medicine
  name: string; // Name of the medicine

  dosage: string; // Dosage info, e.g., "1 tablet" or "5ml"
  frequency: number; // Times per day the medicine should be taken
  timings: Date[]; // Specific times to take medicine (can use getTimeAsDate helper)

  startDate: Date; // When the medicine schedule starts
  endDate?: Date; // Optional end date for the medicine
  stockCount: number; // How many doses/units are currently available
  taken: boolean; // Whether the user has marked this medicine as taken today
  reminder: boolean; // Whether reminders/notifications are enabled for this medicine
  missedTimes?: Date[]; // List of times the user missed taking the medicine (optional)
  notes?: string; // Any extra notes about the medicine (optional)

  type: MedicineType; // Type of schedule: daily, weekly, monthly, asNeeded, custom
  pattern?: number[] | null;
  /* Optional schedule pattern:
     - weekly: [1,3,5] = Mon, Wed, Fri
     - monthly: [1,15] = 1st, 15th
     - custom: any pattern or descriptive string
  */

  category?: string; // Category of medicine (e.g., "Vitamin", "Painkiller") for filtering
  imageUrl?: string; // Optional image URL of the medicine/tablet
  lastTaken?: Date; // Last time the user marked the medicine as taken
  nextDose?: Date; // Calculated next dose time (can be derived from type + pattern + lastTaken)
  reminderSound?: string; // Optional custom sound for notifications
  isArchived?: boolean; // Marks the medicine as inactive or archived without deleting
  refillThreshold?: number; // Minimum stock before reminding user to refill
  createdAt?: Date; // When this medicine was added to the app
  updatedAt?: Date; // Last time this medicine record was updated
}

const KEY = "medicines";

export async function addMedicine(newMedicine: Medicine): Promise<boolean> {
  try {
    const storedMedicines = await AsyncStorage.getItem(KEY);
    const storedMedicinesJSON = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];
    storedMedicinesJSON.push(newMedicine);
    await AsyncStorage.setItem(KEY, JSON.stringify(storedMedicinesJSON));
  } catch (error) {
    console.error("Error retrieving data", error);
    return false;
  }
  return true;
}

export async function getMedicines(): Promise<Medicine[]> {
  try {
    const storedMedicines = await AsyncStorage.getItem(KEY);
    const storedMedicinesJSON = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];
    return storedMedicinesJSON;
  } catch (error) {
    console.error("Error retrieving data", error);
    return [];
  }
}

export async function removeMedicine(id: number): Promise<boolean> {
  try {
    const storedMedicines = await AsyncStorage.getItem(KEY);
    const storedMedicinesJSON = storedMedicines
      ? JSON.parse(storedMedicines)
      : [];
    const newMedicines = storedMedicinesJSON.filter(
      (medicine: Medicine) => medicine.id !== id.toString()
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(newMedicines));
  } catch (error) {
    console.error("Error retrieving data", error);
    return false;
  }
  return true;
}

export async function markAsTaken(id: string) {
  const stored = await AsyncStorage.getItem(KEY);
  let medicines: Medicine[] = stored ? JSON.parse(stored) : [];

  medicines = medicines.map((m) => (m.id === id ? { ...m, taken: true } : m));

  await AsyncStorage.setItem(KEY, JSON.stringify(medicines));
}
