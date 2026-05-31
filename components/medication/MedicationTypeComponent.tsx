import { StyleSheet, Text, View } from "react-native";
import React, { Dispatch, FC, SetStateAction } from "react";
import { MedicineType } from "@/schemas";
import DropdownPickerBox from "@/components/ui/DropdownPickerBox";
import { useAppTheme } from "@/providers/themeProvider";

export interface MedicationTypeProps {
  type: MedicineType;
  setType: Dispatch<SetStateAction<MedicineType>>;
  pattern: number[] | null;
  setPattern: Dispatch<SetStateAction<number[] | null>>;
}

const typesList: MedicineType[] = [
  "pill",
  "liquid",
  "injection",
  "ointment",
  "supplement",
  "other",
];

const MedicationTypeComponent: FC<MedicationTypeProps> = ({
  type,
  setType,
  pattern,
  setPattern,
}) => {
  const { theme } = useAppTheme();
  return (
    <View>
      <Text style={{ fontSize: 16, fontFamily: "ComicBold", color: theme.text, marginTop: 10 }}>Medication Type:</Text>
      <DropdownPickerBox<MedicineType>
        value={type}
        setValue={setType}
        options={typesList}
      />
    </View>
  );
};

export default MedicationTypeComponent;

const styles = StyleSheet.create({});
