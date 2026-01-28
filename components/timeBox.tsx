import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import TimePicker from "react-native-date-picker";

interface TimeBoxProps {
  time: Date;
  index: number;
  timings: Date[];
  setTimes: Dispatch<SetStateAction<Date[]>>;
}

const TimeBox: React.FC<TimeBoxProps> = ({
  time,
  index,
  setTimes,
  timings,
}) => {
  // const [showPicker, setShowPicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  let hour = time.getHours() % 12 || 12;
  let minute = time.getMinutes().toString().padStart(2, "0");
  let ampm = time.getHours() >= 12 ? "PM" : "AM";

  const onChange = (selectedDate: Date | undefined) => {
    // Platform.OS === "android" && setShowPicker(false);
    if (selectedDate) {
      const newTimes = [...timings];
      newTimes[index] = selectedDate;
      newTimes.sort();
      setTimes(newTimes);
    }
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "black",
        padding: 5,
        margin: 5,
        borderRadius: 5,
        flexDirection: "row",
        backgroundColor: "white",
      }}
    >
      <Pressable
        style={{
          paddingLeft: 10,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => setIsVisible(true)}
      >
        <Text style={{ fontSize: 18 }}>
          {hour}:{minute} {ampm}
        </Text>
        <Entypo
          name="edit"
          size={24}
          color="black"
          style={{ paddingHorizontal: 10 }}
        />
      </Pressable>
      <TimePicker
        modal
        open={isVisible}
        date={time}
        mode="time"
        onConfirm={(time) => {
          onChange(time);
        }}
        onCancel={() => {
          setIsVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TimeBox;

// import { Pressable, StyleSheet, Text, View } from "react-native";
// import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
// import Entypo from "@expo/vector-icons/Entypo";
// import RNDateTimePicker from "@react-native-community/datetimepicker";
// // import { Modal, DateTimePicker } from "@react-native-community/datetimepicker";
// // import datetime

// export interface TimeBoxProps {
//   time: Date;
//   index: number;
//   timings: Date[];
//   setTimes: Dispatch<SetStateAction<Date[]>>;
// }
// const TimeBox: React.FC<TimeBoxProps> = ({
//   time,
//   index,
//   setTimes,
//   timings,
// }) => {
//   let hour = time.getHours() % 12 || 12;
//   let minute = time.getMinutes().toString().padStart(2, "0");
//   let ampm = time.getHours() >= 12 ? "PM" : "AM";
//   const [showPicker, setShowPicker] = useState<boolean>(false);
//   useEffect(() => {
//     console.log("timeBox", time);
//     hour = time.getHours() % 12 || 12;
//     minute = time.getMinutes().toString().padStart(2, "0");
//     ampm = time.getHours() >= 12 ? "PM" : "AM";
//   }, [time]);
//   const onChange = () => {
//     console.log("onChange", time);
//     setShowPicker(false);
//     setTimes((prev) => {
//       let newTimes = [...prev];
//       newTimes[index] = time;
//       return newTimes;
//     });
//   };
//   return (
//     <View
//       style={{
//         borderWidth: 1,
//         borderColor: "black",
//         padding: 5,
//         margin: 5,
//         borderRadius: 5,
//         flexDirection: "row",
//         backgroundColor: "white",
//       }}
//     >
//       <Pressable
//         style={{ paddingLeft: 10, flexDirection: "row" }}
//         onPress={() => setShowPicker(true)}
//       >
//         <Text style={{ fontSize: 18 }}>
//           {hour} : {minute} {ampm}
//           {/* {time.getTime().toString()} */}
//         </Text>
//         <Entypo
//           name="edit"
//           size={24}
//           color="black"
//           style={{ paddingHorizontal: 10 }}
//         />{" "}
//       </Pressable>
//       {showPicker && (
//         <RNDateTimePicker
//           mode="time"
//           value={time}
//           is24Hour={false}
//           onChange={onChange}
//           onTouchCancel={() => setShowPicker(false)}
//           display="default"
//         />
//       )}
//     </View>
//   );
// };

// export default TimeBox;

// const styles = StyleSheet.create({});
