import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MedicinePatternType } from "@/schemas";
import DropdownPickerBox from "@/components/ui/DropdownPickerBox";
import DefaultTextInput from "@/components/ui/DefaultTextInput";
import { useAppTheme } from "@/providers/themeProvider";

export interface SchedulePatternSectionProps {
  patternType: MedicinePatternType;
  setPatternType: React.Dispatch<React.SetStateAction<MedicinePatternType>>;
  pattern: number[] | null;
  setPattern: React.Dispatch<React.SetStateAction<number[] | null>>;
}

const SchedulePatternSection: React.FC<SchedulePatternSectionProps> = ({
  patternType,
  setPatternType,
  pattern,
  setPattern,
}) => {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const { theme, isDarkMode } = useAppTheme();

  const toggleWeekday = (index: number) => {
    const currentPattern = pattern || [];
    if (currentPattern.includes(index)) {
      const nextPattern = currentPattern.filter((day) => day !== index);
      setPattern(nextPattern.length > 0 ? nextPattern : null);
    } else {
      setPattern([...currentPattern, index].sort());
    }
  };

  return (
    <View style={{ zIndex: 4000, position: "relative" }}>
      <View style={{ marginVertical: 5 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Schedule Pattern: </Text>
        <DropdownPickerBox<MedicinePatternType>
          value={patternType}
          setValue={setPatternType}
          options={["daily", "weekly", "monthly", "asNeeded", "yearly"]}
        />
        {patternType === "daily" && (
          <Text style={[styles.patternHelperText, { color: theme.subText }]}>Medicine will be taken every single day.</Text>
        )}
        {patternType === "asNeeded" && (
          <Text style={[styles.patternHelperText, { color: theme.subText }]}>Medicine will be taken only as needed (PRN).</Text>
        )}
        {patternType === "yearly" && (
          <Text style={[styles.patternHelperText, { color: theme.subText }]}>Medicine will be taken once a year on the Start Date's month and day.</Text>
        )}
      </View>

      {/* Weekly Day Selector */}
      {patternType === "weekly" && (
        <View style={styles.patternSectionContainer}>
          <Text style={[styles.patternSectionTitle, { color: theme.text }]}>Select Days of Week</Text>
          <View style={[styles.weekdaysContainer, { backgroundColor: theme.card }]}>
            {weekdays.map((day, index) => {
              const isSelected = pattern?.includes(index);
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.weekdayCircle,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    isSelected && [styles.weekdayCircleSelected, { backgroundColor: isDarkMode ? "#00796b" : "#026e02", borderColor: isDarkMode ? "#00796b" : "#026e02" }],
                  ]}
                  onPress={() => toggleWeekday(index)}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      { color: theme.text },
                      isSelected && styles.weekdayTextSelected,
                    ]}
                  >
                    {day.substring(0, 1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Monthly Day Selector */}
      {patternType === "monthly" && (
        <DefaultTextInput
          title="Day of Month (1-28)"
          value={pattern && pattern[0] ? pattern[0].toString() : ""}
          onChangeText={(e: string) => {
            const dayNum = parseInt(e);
            if (dayNum >= 1 && dayNum <= 28) {
              setPattern([dayNum]);
            } else {
              setPattern(null);
            }
          }}
          placeholder="Day of Month (e.g. 15)"
          keyboardType="number-pad"
        />
      )}
    </View>
  );
};

export default SchedulePatternSection;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontFamily: "ComicBold",
    marginBottom: 5,
  },
  patternHelperText: {
    fontFamily: "ComicBold",
    fontSize: 13,
    marginTop: 6,
    fontStyle: "italic",
    paddingHorizontal: 5,
  },
  patternSectionContainer: {
    marginVertical: 10,
  },
  patternSectionTitle: {
    fontSize: 16,
    fontFamily: "ComicBold",
    marginBottom: 10,
  },
  weekdaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  weekdayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayCircleSelected: {
    borderWidth: 1,
  },
  weekdayText: {
    fontSize: 14,
    fontFamily: "ComicBold",
  },
  weekdayTextSelected: {
    color: "white",
  },
});
