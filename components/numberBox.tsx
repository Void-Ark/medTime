import { StyleSheet, Text, View } from "react-native";
import React, { Dispatch, FC, SetStateAction } from "react";
import Entypo from "@expo/vector-icons/Entypo";

export interface NumberBoxProps {
  number: number;
  setNumber: Dispatch<SetStateAction<number>>;
}

const NumberBox: FC<NumberBoxProps> = ({ number, setNumber }) => {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        flexDirection: "row",
      }}
    >
      <Text style={{ fontSize: 20 }}>{number}</Text>
      <Entypo
        name="edit"
        size={24}
        color="black"
        style={{ paddingHorizontal: 10 }}
      />
    </View>
  );
};

export default NumberBox;

const styles = StyleSheet.create({});
