import { useState, useCallback, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
  Platform,
} from "react-native";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { LandingPage } from "./LandingPage";

type AuthStep = "phone" | "code";

/** Strip to digits only */
function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Format 10-digit US number as (555) 123-4567 */
function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/** Convert 10 raw digits to E.164 */
function toE164(digits: string): string {
  return `+1${digits}`;
}

function GetTheApp() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Belay Quest</Text>
        <Text style={styles.subtitle}>
          Your climbing adventure awaits.{"\n"}Download the app to get started.
        </Text>
        <View style={styles.appStoreButtons}>
          <Text style={styles.comingSoon}>Coming soon to iOS and Android</Text>
        </View>
      </View>
      <View style={styles.legalLinks}>
        <Pressable onPress={() => router.push("/legal/privacy")}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>·</Text>
        <Pressable onPress={() => router.push("/legal/tos")}>
          <Text style={styles.legalText}>Terms of Service</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<AuthStep>("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhoneChange = useCallback((text: string) => {
    const raw = digitsOnly(text);
    setPhoneDigits(raw.slice(0, 10));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f4a261" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Web: show parallax landing page instead of phone auth
  if (Platform.OS === "web") {
    return <LandingPage />;
  }

  const handleSendCode = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const e164 = toE164(phoneDigits);
      await signIn("phone", { phone: e164 });
      setStep("code");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const e164 = toE164(phoneDigits);
      await signIn("phone", { phone: e164, code });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Belay Quest</Text>
        <Text style={styles.subtitle}>
          {step === "phone"
            ? "Enter your phone number to get started"
            : "Enter the verification code we sent you"}
        </Text>

        {step === "phone" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              placeholderTextColor="#888"
              value={formatPhone(phoneDigits)}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus
              inputAccessoryViewID="phone-done"
            />
            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={submitting || phoneDigits.length < 10}
            >
              {submitting ? (
                <ActivityIndicator color="#1a1a2e" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#888"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              autoFocus
              inputAccessoryViewID="phone-done"
            />
            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={submitting || code.length === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#1a1a2e" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </Pressable>
            <View style={styles.linkRow}>
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setCode("");
                  setError(null);
                  handleSendCode();
                }}
                disabled={submitting}
              >
                <Text style={styles.linkText}>Resend code</Text>
              </Pressable>
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setStep("phone");
                  setPhoneDigits("");
                  setCode("");
                  setError(null);
                }}
              >
                <Text style={styles.linkText}>Different number</Text>
              </Pressable>
            </View>
          </>
        )}

        {error !== null && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.legalLinks}>
        <Pressable onPress={() => router.push("/legal/privacy")}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>·</Text>
        <Pressable onPress={() => router.push("/legal/tos")}>
          <Text style={styles.legalText}>Terms of Service</Text>
        </Pressable>
      </View>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID="phone-done">
          <View style={styles.accessoryBar}>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f4a261",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#eaeaea",
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    color: "#eaeaea",
    fontSize: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1,
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#f4a261",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  linkButton: {},
  linkText: {
    color: "#f4a261",
    fontSize: 14,
    opacity: 0.8,
  },
  error: {
    color: "#e76f51",
    fontSize: 13,
    marginTop: 16,
    textAlign: "center",
  },
  accessoryBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderTopWidth: 1,
    borderTopColor: "#2a2a4a",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  doneButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneButtonText: {
    color: "#f4a261",
    fontSize: 16,
    fontWeight: "600",
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  legalText: {
    color: "#aaa",
    fontSize: 12,
  },
  legalSeparator: {
    color: "#aaa",
    fontSize: 12,
  },
  appStoreButtons: {
    alignItems: "center",
    gap: 12,
  },
  comingSoon: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
});
