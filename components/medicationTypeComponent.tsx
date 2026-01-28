import { StyleSheet, Text, View } from "react-native";
import React, { Dispatch, FC, SetStateAction } from "react";
import { MedicineType } from "../storage/medicines";
import DropdownPickerBox from "./dropdownPickerBox";

export interface MedicationTypeProps {
  // Add props here
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
  return (
    <View>
      <Text style={{ fontSize: 18 }}>Medication Type: </Text>
      {/* <TypePicker value={type} setValue={setType} options={typesList} /> */}
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
