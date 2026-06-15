// schemas.tsx

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

export interface Medicine {
  id: string; // Unique identifier for the medicine
  name: string; // Name of the medicine
  dosage: string; // Dosage info, e.g., "1 tablet" or "5ml"
  frequency: number; // Times per day the medicine should be taken
  timings: (Date | string)[]; // Specific times to take medicine (Date objects or ISO strings)
  startDate: Date | string; // When the medicine schedule starts (Date object or ISO string)
  endDate?: Date | string; // Optional end date for the medicine (Date object or ISO string)
  stockCount: number; // How many doses/units are currently available
  taken: boolean; // Whether the user has marked this medicine as taken today
  reminder: boolean; // Whether reminders/notifications are enabled for this medicine
  missedTimes?: (Date | string)[]; // List of times the user missed taking the medicine (optional)
  notes?: string; // Any extra notes about the medicine (optional)
  type: MedicineType; // Type of medicine: pill, liquid, etc.
  patternType?: MedicinePatternType; // Pattern type: daily, weekly, etc.
  pattern?: number[] | null;
  /* Optional schedule pattern:
     - weekly: [1,3,5] = Mon, Wed, Fri (where 0 = Sun, 1 = Mon, etc.)
     - monthly: [1,15] = 1st, 15th
  */
  category?: string; // Category of medicine (e.g., "Vitamin", "Painkiller") for filtering
  imageUrl?: string; // Optional image URL of the medicine/tablet
  lastTaken?: Date | string; // Last time the user marked the medicine as taken
  nextDose?: Date | string; // Calculated next dose time
  reminderSound?: string; // Optional custom sound for notifications
  isArchived?: boolean; // Marks the medicine as inactive or archived without deleting
  refillThreshold?: number; // Minimum stock before reminding user to refill
  notificationTriggerIds?: string[]; // Trigger IDs of expo notifications scheduled for this med
  snoozedUntil?: Date | string; // Optional timestamp when medicine is snoozed until
  createdAt?: Date | string; // When this medicine was added to the app
  updatedAt?: Date | string; // Last time this medicine record was updated
}

export interface IntakeLog {
  id: string; // Unique ID for the log entry
  medicineId: string; // The ID of the medicine
  medicineName: string; // The name of the medicine at intake
  dosage: string; // Dosage taken, e.g., "1 tablet"
  takenAt: Date | string; // Timestamp when taken
  status: "taken" | "missed"; // Status of dose
  notes?: string; // Optional notes
}
