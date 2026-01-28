import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  addMedicine,
  Medicine,
  MedicinePatternType,
  MedicineType,
} from "../storage/medicines";
import Entypo from "@expo/vector-icons/Entypo";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import DefaultTextInput from "../components/defaultTextInput";
import TimeBox from "../components/timeBox";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import DateBox from "../components/date/dateBox";
import NumberBox from "../components/numberBox";
import MedicationTypeComponent from "../components/medicationTypeComponent";
// import { TimePicker } from "../components/timePicker";
const MedicationAdd = () => {
  // constants
  const router = useRouter();
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : useSafeAreaInsets().top;

  // states
  const [name, setName] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [frequency, setFrequency] = useState<number>(1);
  const [timings, setTimings] = useState<Array<Date>>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [stockCount, setStockCount] = useState<number>(1);
  const [MedType, setMedType] = useState<MedicineType>("other");
  const [pattern, setPattern] = useState<number[] | null>(null);

  // useEffect
  useEffect(() => {
    !frequency || frequency === 0
      ? setTimings([new Date(Date.now())])
      : setTimings(new Array(frequency).fill(new Date()));
  }, [frequency]);

  return (
    <View>
      <StatusBar translucent backgroundColor="transparent" />

      <LinearGradient
        colors={["#67fc67", "#026e02"]}
        style={{ backgroundColor: "#ffffff" }}
      >
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View
          style={{
            flexDirection: "row",
            // justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Entypo
              name="home"
              size={40}
              color="#ffffff"
              style={{ margin: 10 }}
            />
          </Pressable>
          <View
            style={{
              flex: 1,
              paddingLeft: 20,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 25 }}>Add Medication</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ marginHorizontal: 30 }}>
        <DefaultTextInput
          title="Medication Name"
          value={name}
          onChangeText={setName}
          multiline={true}
          placeholder="Medication Name"
        />

        {/* Medication Type: pill/liquid/injection/ointment */}
        <MedicationTypeComponent
          type={MedType}
          setType={setMedType}
          pattern={pattern}
          setPattern={setPattern}
        />

        <DefaultTextInput
          title="Dosage"
          value={dosage}
          onChangeText={(e) => setDosage(e)}
          multiline={true}
          keyboardType={
            Platform.OS === "android" ? "visible-password" : "default"
          }
          placeholder="Dosage(e.g. 0.5, 1, 50 ml)"
        />

        <DefaultTextInput
          title="no. of times a day"
          value={frequency ? frequency.toString() : ""}
          onChangeText={(e) => {
            let value = parseInt(e);
            setFrequency(value === 0 ? 1 : value);
            // if (e !== "0") setTimings(new Array(frequency).fill(new Date()));
            // else setTimings([]);
          }}
          placeholder="no. of times a day"
          keyboardType="number-pad"
        />

        {/* time boxes */}
        <FlatList
          data={timings}
          keyExtractor={(_, index) => index.toString()}
          style={{ marginHorizontal: 30 }}
          contentContainerStyle={{
            alignItems: "center",
          }}
          numColumns={2}
          renderItem={({ item, index }) => (
            <TimeBox
              time={item}
              index={index}
              setTimes={setTimings}
              timings={timings}
            />
          )}
        />

        {/* Start Date */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            marginVertical: 10,
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <Text style={{ fontSize: 20 }}>Start Date: </Text>
          <DateBox date={startDate} setDate={setStartDate} />
        </View>

        {/* End Date */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            marginVertical: 10,
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <Text style={{ fontSize: 20 }}> End Date: </Text>
          <DateBox date={endDate} setDate={setEndDate} />
        </View>

        {/* stock count */}
        <DefaultTextInput
          title="Total in Stock"
          value={stockCount ? stockCount.toString() : ""}
          onChangeText={(e) => {
            let value = parseInt(e);
            setStockCount(value === 0 ? 1 : value);
            // if (e !== "0") setTimings(new Array(frequency).fill(new Date()));
            // else setTimings([]);
          }}
          placeholder="Total in Stock"
          keyboardType="number-pad"
        />
      </ScrollView>
    </View>
  );
};

export default MedicationAdd;

const styles = StyleSheet.create({
  inputText: {
    backgroundColor: "white",
    margin: 10,
    marginHorizontal: 30,
    padding: 10,
    borderRadius: 10,
    fontSize: 18,
    fontFamily: "ComicBold",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
});
