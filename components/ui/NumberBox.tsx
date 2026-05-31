import { StyleSheet, Text, View } from "react-native";
import React, { Dispatch, FC, SetStateAction } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import { useAppTheme } from "@/providers/themeProvider";

export interface NumberBoxProps {
  number: number;
  setNumber: Dispatch<SetStateAction<number>>;
}

const NumberBox: FC<NumberBoxProps> = ({ number, setNumber }) => {
  const { theme, isDarkMode } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: theme.inputBg,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: isDarkMode ? 0.2 : 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <Text style={{ fontSize: 16, fontFamily: "ComicBold", color: theme.text }}>{number}</Text>
      <Entypo
        name="edit"
        size={18}
        color={isDarkMode ? "#80cbc4" : "green"}
        style={{ paddingHorizontal: 10 }}
      />
    </View>
  );
};

export default NumberBox;

const styles = StyleSheet.create({});
