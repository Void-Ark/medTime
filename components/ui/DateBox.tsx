import { Pressable, StyleSheet, Text, View, Platform, Modal } from "react-native";
import React, { useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAppTheme } from "@/providers/themeProvider";

export interface dateBoxProps {
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const DateBox: React.FC<dateBoxProps> = ({ date, setDate }) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const { theme, isDarkMode } = useAppTheme();

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        onPress={() => setShowPicker(!showPicker)}
        style={{
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: theme.inputBg,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: isDarkMode ? 0.2 : 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Text style={{ fontSize: 16, fontFamily: "ComicBold", color: theme.text }}>
          {new Date(date).toLocaleDateString("en-GB")}
        </Text>
        <Entypo name="edit" size={18} color={isDarkMode ? "#80cbc4" : "green"} style={{ marginLeft: 8 }} />
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
                  value={new Date(date)}
                  mode="date"
                  minimumDate={new Date()}
                  display="inline"
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
            value={new Date(date)}
            mode="date"
            minimumDate={new Date()}
            display="default"
            onChange={onChange}
          />
        )
      )}
    </View>
  );
};

export default DateBox;

const styles = StyleSheet.create({
  iosPickerContainer: {
    borderRadius: 15,
    marginTop: 10,
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
