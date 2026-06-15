# 💊 medTime

**medTime** is an offline-first, accessibility-first medication scheduling and tracking mobile application. Built with **React Native (Expo)** and **TypeScript**, it is designed to help patients—especially seniors—manage their daily pill regimens, receive smart local reminders, and secure their health data entirely on-device.

---

## ✨ Core Features

### 🗄️ 1. Offline-First Database (SQLite)
*   Uses **SQLite** (`expo-sqlite`) in Write-Ahead Logging (WAL) journal mode for fast concurrent operations.
*   Automatic backward-compatible migrations from legacy AsyncStorage to SQLite on startup.
*   Custom row mappings matching TypeScript interfaces (`Medicine` and `IntakeLog`).

### ⏰ 2. Smart Notification Scheduler
*   Powered by **Expo Notifications** and custom local scheduling algorithms.
*   **Intelligent Windows:** Calculates medication intervals and adjusts schedules based on actual dose intake windows (T-1h to T+1h).
*   **Loud Alarms:** Features high-priority notification channels (Android-specific) with custom vibration codes that repeat every 10 minutes.
*   **Snooze & Missed Dose Alerts:** Allows snoozing for 15/30-minute intervals and fires "Missed Dose" warning alerts at the end of the scheduled window.

### 🔒 3. Biometric Security & Privacy
*   Local app lock integration using native device biometrics (FaceID / Fingerprint) via **Expo Local Authentication**.

### 📸 4. Media Storage & Local Cache
*   Attaches photos to medications using **Expo Image Picker**.
*   Permanently saves images to safe application directories with automatic orphaned image cleanup to prevent storage bloat.

### 📦 5. Secure Backup & Portability
*   Exports and imports complete application states (SQLite database + saved photos) via compressed `.zip` archives.
*   Uses **binary file signature sniffing** (reading base64 file signatures) to verify Zip archive integrity before restoration.

### ♿ 6. Senior-Focused Accessibility
*   Custom accessibility context modifying touch-target dimensions and dynamic font scales across the layout.
*   Support for high-contrast light and dark themes.

---

## 🛠️ Tech Stack

*   **Framework:** React Native (Expo SDK 53)
*   **Navigation:** Expo Router (File-based routing)
*   **Language:** TypeScript
*   **Database:** SQLite (`expo-sqlite`) + AsyncStorage
*   **Native Integrations:**
    *   `expo-notifications` (Local pushes)
    *   `expo-local-authentication` (Biometrics)
    *   `expo-file-system` (Data caching & directory handling)
    *   `react-native-zip-archive` (Backup packing)
    *   `expo-image-picker` (Camera & Photo support)
*   **Animations:** React Native Reanimated

---

## 📁 Project Structure

```
medTime/
├── app/                  # Expo Router screen layouts (Home, Add, History, Settings, etc.)
├── assets/               # Local images, fonts, and custom branding assets
├── components/           # Reusable UI & Medication components
│   ├── medication/       # Add medication sections, progress circles, and cards
│   └── ui/               # Core atomic layout elements (Pickers, Inputs, Pick-boxes)
├── constants/            # Static configuration keys, values, and styles
├── hooks/                # Custom React hooks (useMedicines, useBiometrics)
├── providers/            # Accessibility, font loading, and application theme contexts
├── services/             # Notification service wrapper (channels, schedulers)
├── storage/              # SQLite schema scripts, DB queries, and file migrators
├── utils/                # Compress files, format dates, and manage local cached images
├── schemas.tsx           # Application TypeScript models and log contracts
└── app.json              # Expo application configuration
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed. You will also need the Expo Go app on your physical device, or an Android/iOS emulator configured.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/your-username/medTime.git
   cd medTime
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```

### Running the Application

*   **Start Expo Development Server:**
    ```bash
    npm run start
    ```
    Scan the QR code displayed in the terminal with your device's camera (iOS) or Expo Go app (Android).

*   **Run on Android Emulator:**
    ```bash
    npm run android
    ```

*   **Run on iOS Simulator:**
    ```bash
    npm run ios
    ```

---

## 🛣️ Roadmap

*   [ ] Write unit tests for date occurrences and scheduling logic using Jest.
*   [ ] Implement Zustand state management to simplify database synchronizations.
*   [ ] Integrate cloud-backup endpoints (Firebase Data Connect or PostgreSQL) as an optional feature.
