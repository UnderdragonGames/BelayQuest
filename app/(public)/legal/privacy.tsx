import { ScrollView, Text, View, StyleSheet } from "react-native";

const COLORS = {
  bg: "#1a1a2e",
  card: "#16213e",
  text: "#eaeaea",
  heading: "#f4a261",
  muted: "#aaa",
  border: "#2a2a4a",
};

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.effectiveDate}>Effective: March 3, 2026</Text>

      <Section title="What We Collect">
        {`BelayQuest collects the following information:\n\n` +
          `• Phone number — used for account creation and login via SMS verification\n` +
          `• Display name and climbing preferences — provided by you during onboarding\n` +
          `• Climbing session data — grades, attempts, and completions you log in the app\n` +
          `• Device information — platform and OS version for app compatibility`}
      </Section>

      <Section title="How We Use Your Data">
        {`Your data is used to:\n\n` +
          `• Authenticate your identity via one-time SMS codes\n` +
          `• Display your climbing progress, XP, and character stats\n` +
          `• Enable social features like Raids and the Quest Board\n` +
          `• Improve the app experience`}
      </Section>

      <Section title="Third-Party Services">
        {`We use the following third-party services:\n\n` +
          `• Convex — cloud database and backend (data processor)\n` +
          `• Twilio — SMS delivery for phone verification\n\n` +
          `These services process your data only as needed to provide their functionality and are bound by their own privacy policies.`}
      </Section>

      <Section title="Data Sharing">
        {`We do not sell, rent, or trade your personal information. Your data is only shared with the third-party services listed above as necessary to operate the app.`}
      </Section>

      <Section title="Data Retention">
        {`Your data is retained as long as your account is active. You may request account deletion by contacting us, and we will remove your data within 30 days.`}
      </Section>

      <Section title="Children's Privacy">
        {`BelayQuest is not intended for children under 13. We do not knowingly collect data from children under 13.`}
      </Section>

      <Section title="Changes to This Policy">
        {`We may update this policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.`}
      </Section>

      <Section title="Contact">
        {`If you have questions about this privacy policy, please contact us through the app.`}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.heading,
    marginBottom: 4,
  },
  effectiveDate: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.heading,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
});
