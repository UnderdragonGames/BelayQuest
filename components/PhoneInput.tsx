import { MaskedTextInput } from "react-native-mask-text";
import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { COLORS } from "@/lib/theme";

interface PhoneInputProps {
  value: string;
  onChangeDigits: (digits: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle | TextStyle;
  inputAccessoryViewID?: string;
  onSubmitEditing?: () => void;
  mask?: string;
}

export function PhoneInput({
  value,
  onChangeDigits,
  placeholder = "(555) 123-4567",
  disabled = false,
  autoFocus = false,
  style,
  inputAccessoryViewID,
  onSubmitEditing,
  mask = "(999) 999-9999",
}: PhoneInputProps) {
  return (
    <MaskedTextInput
      mask={mask}
      value={value}
      onChangeText={(_masked, raw) => {
        onChangeDigits(raw.replace(/\D/g, ""));
      }}
      placeholder={placeholder}
      placeholderTextColor={COLORS.muted}
      keyboardType="phone-pad"
      editable={!disabled}
      autoFocus={autoFocus}
      inputAccessoryViewID={inputAccessoryViewID}
      onSubmitEditing={onSubmitEditing}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontFamily: "VT323",
  },
});
