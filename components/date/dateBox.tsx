import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import DatePicker from "react-native-date-picker";

export interface dateBoxProps {
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const DateBox: React.FC<dateBoxProps> = ({ date, setDate }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  return (
    <View>
      <Pressable
        onPress={() => setIsVisible(!isVisible)}
        style={{
          paddingHorizontal: 15,
          paddingVertical: 5,
          borderRadius: 5,
          backgroundColor: "#fff",
          borderWidth: 1,
          flexDirection: "row",
        }}
      >
        <Text style={{ fontSize: 18 }}>{date.toLocaleDateString("en-GB")}</Text>
        <Entypo name="edit" size={24} color="black" style={{ marginLeft: 5 }} />
      </Pressable>
      {isVisible && (
        <DatePicker
          // title={"hello world"}
          modal
          open={isVisible}
          date={date}
          mode="date"
          minimumDate={new Date()}
          onConfirm={(date) => {
            setIsVisible(false);
            setDate(date);
          }}
          onCancel={() => {
            setIsVisible(false);
          }}
        />
      )}
    </View>
  );
};

export default DateBox;

const styles = StyleSheet.create({});
