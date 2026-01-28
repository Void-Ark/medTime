import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import React from "react";

export interface DefaultTextInputProps extends TextInputProps {
  title: string;
}
const DefaultTextInput: React.FC<DefaultTextInputProps> = (props) => {
  const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    title: {
      position: "absolute",
      top: -10,
      left: 5,
      backgroundColor: "white",
      paddingHorizontal: 5,
      fontSize: 16,
      fontFamily: "ComicBold",
      borderRadius: 15,
    },
    inputText: {
      backgroundColor: "white",
      padding: 10,
      borderRadius: 10,
      fontSize: 18,
      fontFamily: "ComicBold",
      shadowOpacity: 0.2,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      borderColor: props.value ? "green" : "red",
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
        placeholderTextColor={"gray"}
      />
      {props.value && <Text style={styles.title}>{props.title}</Text>}
    </View>
  );
};

export default DefaultTextInput;
