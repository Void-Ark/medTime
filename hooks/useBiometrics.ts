import { useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";

export function useBiometrics() {
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAuthenticationSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);

      // In production, you would check secure storage for your PIN.
      // For this offline demo, we simulate a PIN existence check.
      const hasStoredPin = false; 
      setHasPin(hasStoredPin);
    } catch (err) {
      console.error("useBiometrics hardware check error:", err);
    }
  };

  useEffect(() => {
    checkAuthenticationSupport();
  }, []);

  const authenticate = async (onSuccess: () => void) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);

      if (hasBiometrics) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to access MedTime",
          fallbackLabel: "Use PIN",
        });

        if (result.success) {
          onSuccess();
        } else {
          setAuthError("Authentication failed. Please try again.");
        }
      } else {
        // Fallback: If no biometrics but a PIN is stored, prompt or bypass.
        // If neither exists, navigate forward as fallback.
        onSuccess();
      }
    } catch (err) {
      setAuthError("Authentication error. Please try again.");
      console.error("useBiometrics authenticate error:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    hasBiometrics,
    hasPin,
    isAuthenticating,
    authError,
    authenticate,
    checkAuthenticationSupport,
  };
}
