import { Pressable, StyleSheet, Text, View, Platform, Modal } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAppTheme } from "@/providers/themeProvider";

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
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.inputBorder,
          padding: 8,
          margin: 6,
          borderRadius: 10,
          flexDirection: "row",
          backgroundColor: theme.inputBg,
          shadowColor: "#000",
          shadowOpacity: isDarkMode ? 0.2 : 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Pressable
          style={{
            paddingLeft: 10,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text style={{ fontSize: 16, fontFamily: "ComicBold", color: theme.text }}>
            {hour}:{minute} {ampm}
          </Text>
          <Entypo
            name="edit"
            size={18}
            color={isDarkMode ? "#80cbc4" : "green"}
            style={{ paddingHorizontal: 10 }}
          />
        </Pressable>
      </View>
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
                  style={[styles.closeButton, { backgroundColor: isDarkMode ? "#004d40" : "#026e02" }]}
                >
                  <Text style={styles.closeButtonText}>Done</Text>
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
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "ComicBold",
  },
});
