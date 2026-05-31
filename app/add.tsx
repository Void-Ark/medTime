import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Medicine, MedicineType, MedicinePatternType } from "@/schemas";
import { useMedicines } from "@/hooks/useMedicines";
import Entypo from "@expo/vector-icons/Entypo";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import DefaultTextInput from "@/components/ui/DefaultTextInput";
import TimeBox from "@/components/ui/TimeBox";
import MedicationTypeComponent from "@/components/medication/MedicationTypeComponent";
import PhotoPickerSection from "@/components/medication/add/PhotoPickerSection";
import SchedulePatternSection from "@/components/medication/add/SchedulePatternSection";
import DurationSection from "@/components/medication/add/DurationSection";
import { useAppTheme } from "@/providers/themeProvider";

const MedicationAdd = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { theme, isDarkMode } = useAppTheme();

  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight
      : useSafeAreaInsets().top;

  const { addMed, updateMed, medicines } = useMedicines();

  // Centralized medication form states
  const [name, setName] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [frequency, setFrequency] = useState<number>(1);
  const [timings, setTimings] = useState<Array<Date>>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [stockCount, setStockCount] = useState<number>(1);
  const [MedType, setMedType] = useState<MedicineType>("other");
  const [pattern, setPattern] = useState<number[] | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [patternType, setPatternType] = useState<MedicinePatternType>("daily");
  const [isPermanent, setIsPermanent] = useState<boolean>(true);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Pre-populate state if in Edit Mode
  useEffect(() => {
    if (isEditMode && id && medicines.length > 0 && !isLoaded) {
      const existing = medicines.find((m) => m.id === id);
      if (existing) {
        setName(existing.name);
        setDosage(existing.dosage);
        setFrequency(existing.frequency);
        
        const mappedTimings = (existing.timings || []).map((t) =>
          typeof t === "string" ? new Date(t) : t
        );
        setTimings(mappedTimings);
        
        setStartDate(typeof existing.startDate === "string" ? new Date(existing.startDate) : existing.startDate);
        if (existing.endDate) {
          setEndDate(typeof existing.endDate === "string" ? new Date(existing.endDate) : existing.endDate);
          setIsPermanent(false);
        } else {
          setIsPermanent(true);
        }
        setStockCount(existing.stockCount);
        setMedType(existing.type);
        setPattern(existing.pattern || null);
        setPatternType(existing.patternType || "daily");
        setImageUri(existing.imageUrl || null);
        setIsLoaded(true);
      }
    }
  }, [isEditMode, id, medicines, isLoaded]);

  // Dynamic timing count updates
  useEffect(() => {
    if (isEditMode && !isLoaded) return; // Skip during initial populating load
    
    if (timings.length !== frequency) {
      !frequency || frequency === 0
        ? setTimings([new Date(Date.now())])
        : setTimings(new Array(frequency).fill(new Date()));
    }
  }, [frequency, isLoaded]);

  // Clean sub-pattern states on timing schedule resets
  useEffect(() => {
    if (isEditMode && !isLoaded) return; // Skip during initial populating load
    
    if (patternType === "weekly") {
      setPattern([]);
    } else {
      setPattern(null);
    }
  }, [patternType, isLoaded]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a medication name");
      return;
    }
    if (!dosage.trim()) {
      alert("Please enter a dosage");
      return;
    }
    if (!frequency || frequency <= 0) {
      alert("Please enter a valid number of times a day");
      return;
    }

    if (patternType === "weekly" && (!pattern || pattern.length === 0)) {
      alert("Please select at least one day of the week for weekly schedule.");
      return;
    }
    if (patternType === "monthly" && (!pattern || pattern.length === 0 || !pattern[0])) {
      alert("Please enter a valid day of the month (1-31) for monthly schedule.");
      return;
    }

    const savedMed: Medicine = {
      id: isEditMode && id ? id : Math.random().toString(36).substring(7),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      timings,
      startDate,
      endDate: isPermanent ? undefined : endDate,
      stockCount,
      taken: false,
      reminder: true,
      type: MedType,
      patternType,
      pattern,
      imageUrl: imageUri || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const success = isEditMode ? await updateMed(savedMed) : await addMed(savedMed);
    if (success) {
      if (isEditMode) {
        router.replace("/medications");
      } else {
        router.replace("/home");
      }
    } else {
      alert("Failed to save medication. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header bar */}
      <LinearGradient
        colors={isDarkMode ? ["#37474f", "#212121"] : ["#67fc67", "#026e02"]}
        style={{ backgroundColor: "transparent" }}
      >
        <View style={{ width: "100%", height: statusBarHeight }}></View>
        <View
          style={{
            flexDirection: "row",
            alignContent: "center",
            paddingVertical: 10,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Entypo
              name="home"
              size={36}
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
            <Text style={{ color: "white", fontSize: 22, fontFamily: "ComicBold" }}>
              {isEditMode ? "Edit Medication" : "Add Medication"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Form layout */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50, paddingTop: 15 }}>
        <DefaultTextInput
          title="Medication Name"
          value={name}
          onChangeText={setName}
          multiline={true}
          placeholder="Medication Name"
        />

        <View style={{ zIndex: 5000, position: "relative" }}>
          <MedicationTypeComponent
            type={MedType}
            setType={setMedType}
            pattern={pattern}
            setPattern={setPattern}
          />
        </View>

        <SchedulePatternSection
          patternType={patternType}
          setPatternType={setPatternType}
          pattern={pattern}
          setPattern={setPattern}
        />

        <DefaultTextInput
          title="Dosage"
          value={dosage}
          onChangeText={setDosage}
          multiline={true}
          placeholder="Dosage(e.g. 0.5, 1, 50 ml)"
        />

        <PhotoPickerSection
          imageUri={imageUri}
          setImageUri={setImageUri}
        />

        <DefaultTextInput
          title="no. of times a day"
          value={frequency ? frequency.toString() : ""}
          onChangeText={(e: string) => {
            let value = parseInt(e);
            setFrequency(value === 0 ? 1 : value);
          }}
          placeholder="no. of times a day"
          keyboardType="number-pad"
        />

        {/* Dynamic timings trigger list */}
        <View style={styles.timingsContainer}>
          {timings.map((item, index) => (
            <TimeBox
              key={index}
              time={item}
              index={index}
              setTimes={setTimings}
              timings={timings}
            />
          ))}
        </View>

        <DurationSection
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isPermanent={isPermanent}
          setIsPermanent={setIsPermanent}
        />

        {/* Total Available stock units */}
        <DefaultTextInput
          title="Total dosage available"
          value={stockCount ? stockCount.toString() : ""}
          onChangeText={(e: string) => {
            let value = parseInt(e);
            setStockCount(value === 0 ? 1 : value);
          }}
          placeholder="Total dosage available"
          keyboardType="number-pad"
        />

        <Pressable
          onPress={handleSave}
          style={({ pressed }: { pressed: boolean }) => [
            styles.saveButton,
            { shadowColor: isDarkMode ? "transparent" : "#026e02" },
            pressed && styles.saveButtonPressed,
          ]}
        >
          <LinearGradient
            colors={isDarkMode ? ["#80cbc4", "#004d40"] : ["#67fc67", "#026e02"]}
            style={styles.saveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.saveButtonText}>
              {isEditMode ? "Update Medication" : "Save Medication"}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default MedicationAdd;

const styles = StyleSheet.create({
  saveButton: {
    marginHorizontal: 30,
    marginVertical: 25,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#026e02",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "ComicBold",
  },
  timingsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginHorizontal: 30,
    marginVertical: 10,
  },
});
