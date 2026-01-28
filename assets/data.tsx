import { MedCardProps } from "../components/medCard";
import { QuickActionBoxProps } from "../components/quickActionBox";
import getTimeAsDate from "../utils/getTimeAsDate";

export const MED_CARD_DATA: MedCardProps[] = [
  // Test Case 1: Morning medication, not taken yet
  {
    medicine_name: "Paracetamol______________________________",
    quantity: "2 tablets",
    time: getTimeAsDate(8, 0), // 08:00 AM
    taken: false,
  },
  // Test Case 2: Noon medication, taken
  {
    medicine_name: "Ibuprofen",
    quantity: "1 tablet",
    time: getTimeAsDate(12, 30), // 12:30 PM
    taken: true,
  },
  // Test Case 3: Evening medication, not taken
  {
    medicine_name: "Vitamin D",
    quantity: "1 capsule",
    time: getTimeAsDate(18, 15), // 06:15 PM
    taken: false,
  },
  // Test Case 4: Night medication, taken
  {
    medicine_name: "Melatonin",
    quantity: "1 tablet",
    time: getTimeAsDate(22, 45), // 10:45 PM
    taken: true,
  },
  // Test Case 5: Early morning medication, not taken
  {
    medicine_name: "Aspirin",
    quantity: "1 tablet",
    time: getTimeAsDate(6, 0), // 06:00 AM
    taken: false,
  },
];

export const QUICK_ACTIONS: QuickActionBoxProps[] = [
  {
    icon: "add_medication",
    label: "Add\nMedication",
    route: "/add",
    color: "white",
    gradient: ["#00f7007c", "#009500"] as [string, string],
  },
  {
    icon: "calander",
    label: "Calander\nView",
    route: "/calendar" as const,
    color: "white",
    gradient: ["#0059ff4b", "#0059ff"] as [string, string],
  },
  {
    icon: "history",
    label: "History\nLog",
    route: "/history",
    color: "white",
    gradient: ["#fb00ff3b", "#a200a4"] as [string, string],
  },
  {
    icon: "refill_tracker",
    label: "Refill\nTracker",
    route: "/refills",
    color: "white",
    gradient: ["#f9a60055", "#f9a600"] as [string, string],
  },
];
