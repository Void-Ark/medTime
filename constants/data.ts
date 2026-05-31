import { MedCardProps } from "@/components/medication/MedCard";
import { QuickActionBoxProps } from "@/components/medication/QuickActionBox";
import getTimeAsDate from "@/utils/getTimeAsDate";

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
    label: "Calendar\nView",
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
  {
    icon: "medications",
    label: "My\nMedications",
    route: "/medications",
    color: "white",
    gradient: ["#00e5ff5b", "#00b8d4"] as [string, string],
  },
  {
    icon: "settings",
    label: "Settings\nManager",
    route: "/settings",
    color: "white",
    gradient: ["#9e9e9e5b", "#424242"] as [string, string],
  },
];
