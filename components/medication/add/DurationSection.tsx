import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import DateBox from "@/components/ui/DateBox";
import { useAppTheme } from "@/providers/themeProvider";

export interface DurationSectionProps {
  startDate: Date;
  setStartDate: React.Dispatch<React.SetStateAction<Date>>;
  endDate: Date;
  setEndDate: React.Dispatch<React.SetStateAction<Date>>;
  isPermanent: boolean;
  setIsPermanent: (isPermanent: boolean) => void;
}

const DurationSection: React.FC<DurationSectionProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isPermanent,
  setIsPermanent,
}) => {
  const { theme, isDarkMode } = useAppTheme();

  return (
    <View>
      {/* Start Date */}
      <View style={styles.dateRow}>
        <Text style={[styles.dateLabel, { color: theme.text }]}>Start Date: </Text>
        <DateBox date={startDate} setDate={setStartDate} />
      </View>

      {/* Permanent Toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
        <Text style={[styles.toggleText, { color: theme.text }]}>Permanent medicine (No end date)?</Text>
        <Switch
          value={isPermanent}
          onValueChange={setIsPermanent}
          trackColor={{ false: "#ccc", true: isDarkMode ? "#80cbc4" : "#a5daa5" }}
          thumbColor={isPermanent ? (isDarkMode ? "#00796b" : "#026e02") : "#f4f3f3"}
        />
      </View>

      {/* End Date */}
      {!isPermanent && (
        <View style={styles.dateRow}>
          <Text style={[styles.dateLabel, { color: theme.text }]}> End Date: </Text>
          <DateBox date={endDate} setDate={setEndDate} />
        </View>
      )}
    </View>
  );
};

export default DurationSection;

const styles = StyleSheet.create({
  dateRow: {
    width: "100%",
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  dateLabel: {
    fontSize: 16,
    fontFamily: "ComicBold",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleText: {
    fontFamily: "ComicBold",
    fontSize: 15,
    flex: 1,
  },
});
