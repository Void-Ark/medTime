import React, { Dispatch, SetStateAction, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import capitalize from "../utils/capitalize";

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

  const [items, setItems] = useState<PickerItem<T>[]>(
    options.map((option) => ({
      label: capitalize(option),
      value: option,
    }))
  );

  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue as any} // usually matches DropDownPicker's expected type
      setItems={setItems}
      placeholder={placeholder}
      style={{
        marginVertical: 10,
        borderColor: "green",
      }}
      textStyle={{
        fontSize: 16,
      }}
    />
  );
}
