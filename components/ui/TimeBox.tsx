import { Pressable, StyleSheet, Text, View, Platform, Modal } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAppTheme } from "@/providers/themeProvider";
import { useAccessibility } from "@/providers/accessibilityProvider";

interface TimeBoxProps {
  time: Date;
  index: number;
  timings: Date[];
  setTimes: Dispatch<SetStateAction<Date[]>>;
}

const TimeBox: React.FC<TimeBoxProps> = ({
  time,
  index,
  setTimes,
  timings,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const { theme, isDarkMode } = useAppTheme();
  const { fontSize, touchTarget } = useAccessibility();

  const timeDate = typeof time === "string" ? new Date(time) : time;

  let hour = timeDate.getHours() % 12 || 12;
  let minute = timeDate.getMinutes().toString().padStart(2, "0");
  let ampm = timeDate.getHours() >= 12 ? "PM" : "AM";

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const newTimes = [...timings].map(t => typeof t === "string" ? new Date(t) : t);
      newTimes[index] = selectedDate;
      newTimes.sort((a, b) => a.getTime() - b.getTime());
      setTimes(newTimes);
    }
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        onPress={() => setShowPicker(!showPicker)}
        style={({ pressed }) => [
          {
            borderWidth: 1,
            borderColor: theme.inputBorder,
            paddingVertical: 8,
            paddingHorizontal: 16,
            margin: 6,
            borderRadius: 10,
            flexDirection: "row",
            backgroundColor: theme.inputBg,
            shadowColor: "#000",
            shadowOpacity: isDarkMode ? 0.2 : 0.05,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
            minHeight: touchTarget("minHeight") * 0.8,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.85 : 1.0,
          }
        ]}
      >
        <Text style={{ fontSize: fontSize("sm"), fontFamily: "ComicBold", color: theme.text }}>
          {hour}:{minute} {ampm}
        </Text>
        <Entypo
          name="edit"
          size={fontSize("sm")}
          color={isDarkMode ? "#80cbc4" : "green"}
          style={{ paddingLeft: 10 }}
        />
      </Pressable>
      {showPicker && (
        Platform.OS === "ios" ? (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <Pressable 
              style={styles.modalOverlay} 
              onPress={() => setShowPicker(false)}
            >
              <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                <RNDateTimePicker
                  value={timeDate}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={onChange}
                  themeVariant={isDarkMode ? "dark" : "light"}
                />
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={[styles.closeButton, { backgroundColor: isDarkMode ? "#004d40" : "#026e02", minHeight: touchTarget("minHeight"), paddingVertical: touchTarget("paddingV") }]}
                >
                  <Text style={[styles.closeButtonText, { fontSize: fontSize("sm") }]}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        ) : (
          <RNDateTimePicker
            value={timeDate}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onChange}
          />
        )
      )}
    </View>
  );
};

export default TimeBox;

const styles = StyleSheet.create({
  iosPickerContainer: {
    borderRadius: 15,
    marginTop: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  closeButton: {
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    justifyContent: "center",
  },
  closeButtonText: {
    color: "white",
    fontFamily: "ComicBold",
  },
});

