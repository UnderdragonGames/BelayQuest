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

export default function TermsOfService() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.effectiveDate}>Effective: March 3, 2026</Text>

      <Section title="Acceptance of Terms">
        {`By using BelayQuest, you agree to these Terms of Service. If you do not agree, do not use the app.`}
      </Section>

      <Section title="Description of Service">
        {`BelayQuest is a mobile app that gamifies indoor rock climbing. You can log climbing sessions, track progress, earn XP, and coordinate group climbing sessions (Raids) with other users.`}
      </Section>

      <Section title="Account & Authentication">
        {`You must provide a valid phone number to create an account. You are responsible for maintaining access to your phone number and for all activity under your account. You must be at least 13 years old to use BelayQuest.`}
      </Section>

      <Section title="Acceptable Use">
        {`You agree not to:\n\n` +
          `• Use the app for any unlawful purpose\n` +
          `• Harass, abuse, or harm other users\n` +
          `• Attempt to gain unauthorized access to the app or its systems\n` +
          `• Submit false or misleading climbing data\n` +
          `• Interfere with the app's operation or other users' experience`}
      </Section>

      <Section title="Climbing Safety">
        {`BelayQuest is a logging and social tool — it does not provide climbing instruction or safety guidance. You are solely responsible for your own safety while climbing. Always follow your gym's rules and safety protocols.`}
      </Section>

      <Section title="Account Termination">
        {`We may suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion. You may delete your account at any time by contacting us.`}
      </Section>

      <Section title="Disclaimer of Warranties">
        {`BelayQuest is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the app will be available, error-free, or meet your expectations.`}
      </Section>

      <Section title="Limitation of Liability">
        {`To the maximum extent permitted by law, BelayQuest and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.`}
      </Section>

      <Section title="Changes to Terms">
        {`We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.`}
      </Section>

      <Section title="Contact">
        {`If you have questions about these terms, please contact us through the app.`}
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
