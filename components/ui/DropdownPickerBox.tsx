import React, { Dispatch, SetStateAction, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import capitalize from "@/utils/capitalize";
import { useAppTheme } from "@/providers/themeProvider";

interface DropDownPickerBoxProps<T extends string> {
  value: T | null;
  setValue: Dispatch<SetStateAction<T>>;
  options: T[];
  placeholder?: string;
}

interface PickerItem<T extends string> {
  label: string;
  value: T;
}

export default function DropdownPickerBox<T extends string>({
  value,
  setValue,
  options,
  placeholder = "Select an option",
}: DropDownPickerBoxProps<T>) {
  const [open, setOpen] = useState(false);
  const { theme, isDarkMode } = useAppTheme();

  const [items, setItems] = useState<PickerItem<T>[]>(
    options.map((option) => ({
      label: capitalize(option),
      value: option,
    }))
  );

  return (
    <DropDownPicker
      listMode="SCROLLVIEW"
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue as any} // usually matches DropDownPicker's expected type
      setItems={setItems}
      placeholder={placeholder}
      theme={isDarkMode ? "DARK" : "LIGHT"}
      style={{
        marginVertical: 10,
        backgroundColor: theme.inputBg,
        borderColor: value ? (isDarkMode ? "#80cbc4" : "green") : (isDarkMode ? "#e57373" : "red"),
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}
      textStyle={{
        fontSize: 16,
        fontFamily: "ComicBold",
        color: theme.text,
      }}
      dropDownContainerStyle={{
        backgroundColor: theme.inputBg,
        borderColor: theme.inputBorder,
      }}
    />
  );
}
