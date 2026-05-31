import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import React from "react";
import { useAppTheme } from "@/providers/themeProvider";

export interface DefaultTextInputProps extends TextInputProps {
  title: string;
}
const DefaultTextInput: React.FC<DefaultTextInputProps> = (props) => {
  const { theme, isDarkMode } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    title: {
      position: "absolute",
      top: -10,
      left: 15,
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      fontSize: 14,
      fontFamily: "ComicBold",
      borderRadius: 15,
      color: theme.subText,
    },
    inputText: {
      backgroundColor: theme.inputBg,
      color: theme.text,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 12,
      fontSize: 16,
      fontFamily: "ComicBold",
      shadowColor: "#000",
      shadowOpacity: isDarkMode ? 0.2 : 0.05,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      borderColor: props.value ? (isDarkMode ? "#80cbc4" : "green") : (isDarkMode ? "#e57373" : "red"),
      borderWidth: 1,
    },
  });
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={props.placeholder}
        value={props.value}
        onChangeText={props.onChangeText}
        style={[styles.inputText, props.style]}
        keyboardType={props.keyboardType}
        placeholderTextColor={isDarkMode ? "#888888" : "gray"}
        {...props}
      />
      {props.value && <Text style={styles.title}>{props.title}</Text>}
    </View>
  );
};

export default DefaultTextInput;
