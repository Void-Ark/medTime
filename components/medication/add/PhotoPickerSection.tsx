import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as ImagePicker from "expo-image-picker";
import { useAppTheme } from "@/providers/themeProvider";

export interface PhotoPickerSectionProps {
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
}

const PhotoPickerSection: React.FC<PhotoPickerSectionProps> = ({
  imageUri,
  setImageUri,
}) => {
  const { theme, isDarkMode } = useAppTheme();

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("An error occurred while picking the image.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permissions are required to take a photo of your medication.");
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      alert("An error occurred while taking the photo.");
    }
  };

  return (
    <View style={styles.imageSectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Medication Photo</Text>
      {imageUri ? (
        <View style={[styles.imagePreviewContainer, { borderColor: theme.border }]}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <Pressable
            style={[styles.deleteImageButton, { backgroundColor: theme.card }]}
            onPress={() => setImageUri(null)}
          >
            <Entypo name="circle-with-cross" size={24} color={theme.danger} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.imageSelectorButtons}>
          <Pressable style={[styles.imagePickerButton, { backgroundColor: theme.inputBg, borderColor: isDarkMode ? "#00796b" : "#a5daa5" }]} onPress={pickImage}>
            <FontAwesome6 name="image" size={20} color={isDarkMode ? "#80cbc4" : "#026e02"} />
            <Text style={[styles.imagePickerText, { color: isDarkMode ? "#80cbc4" : "#026e02" }]}>Gallery</Text>
          </Pressable>
          <Pressable style={[styles.imagePickerButton, { backgroundColor: theme.inputBg, borderColor: isDarkMode ? "#00796b" : "#a5daa5" }]} onPress={takePhoto}>
            <FontAwesome6 name="camera" size={20} color={isDarkMode ? "#80cbc4" : "#026e02"} />
            <Text style={[styles.imagePickerText, { color: isDarkMode ? "#80cbc4" : "#026e02" }]}>Camera</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default PhotoPickerSection;

const styles = StyleSheet.create({
  imageSectionContainer: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "ComicBold",
    marginBottom: 10,
  },
  imageSelectorButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 15,
    borderRadius: 12,
  },
  imagePickerText: {
    fontFamily: "ComicBold",
    fontSize: 16,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  deleteImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 12,
  },
});
