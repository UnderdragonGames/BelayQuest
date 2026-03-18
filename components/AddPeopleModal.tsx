import * as Contacts from "expo-contacts";
import { parsePhoneNumber } from "libphonenumber-js";
import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { copy } from "@/lib/copy/en";
import { COLORS } from "@/lib/theme";
import { PhoneInput } from "./PhoneInput";
import { StoneButton } from "./StoneButton";

export interface AddedPerson {
  phone: string;
  name?: string;
  source: "manual" | "contacts";
}

interface AddPeopleModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entries: AddedPerson[]) => void;
  sessionId?: Id<"sessions">;
  mode?: "single" | "batch";
}

type Tab = "phone" | "contacts";

function normalizePhone(input: string): string | null {
  try {
    const parsed = parsePhoneNumber(input, "US");
    if (!parsed.isValid()) return null;
    return parsed.format("E.164");
  } catch {
    return null;
  }
}

function hasMinDigits(input: string): boolean {
  return (input.match(/\d/g) ?? []).length >= 10;
}

export function AddPeopleModal({
  visible,
  onClose,
  onAdd,
  mode = "single",
}: AddPeopleModalProps) {
  const [tab, setTab] = useState<Tab>("phone");

  // Phone tab state
  const [phoneInput, setPhoneInput] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [batchList, setBatchList] = useState<AddedPerson[]>([]);

  // Contacts tab state
  const [contactsPermission, setContactsPermission] = useState<
    "undetermined" | "granted" | "denied"
  >("undetermined");
  const [contacts, setContacts] = useState<Contacts.ExistingContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setTab("phone");
      setPhoneInput("");
      setNicknameInput("");
      setPhoneError(null);
      setBatchList([]);
      setContactSearch("");
    }
  }, [visible]);

  async function requestContactsAndLoad() {
    setContactsLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        setContactsPermission("granted");
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        setContacts(data.filter((c) => (c.phoneNumbers?.length ?? 0) > 0));
      } else {
        setContactsPermission("denied");
      }
    } catch {
      setContactsPermission("denied");
    }
    setContactsLoading(false);
  }

  function handleTabPress(t: Tab) {
    setTab(t);
    if (t === "contacts" && contactsPermission === "undetermined") {
      requestContactsAndLoad();
    }
  }

  function handleAddPhone() {
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      if (!hasMinDigits(phoneInput)) {
        setPhoneError("Enter at least 10 digits.");
      } else {
        setPhoneError("Invalid phone number.");
      }
      return;
    }

    if (mode === "batch") {
      if (batchList.some((p) => p.phone === normalized)) {
        setPhoneError("Already added.");
        return;
      }
      const person: AddedPerson = {
        phone: normalized,
        name: nicknameInput.trim() || undefined,
        source: "manual",
      };
      setBatchList((prev) => [...prev, person]);
      setPhoneInput("");
      setNicknameInput("");
      setPhoneError(null);
      Keyboard.dismiss();
    } else {
      const person: AddedPerson = {
        phone: normalized,
        name: nicknameInput.trim() || undefined,
        source: "manual",
      };
      onAdd([person]);
      setPhoneInput("");
      setNicknameInput("");
      setPhoneError(null);
    }
  }

  function handleRemoveFromBatch(phone: string) {
    setBatchList((prev) => prev.filter((p) => p.phone !== phone));
  }

  function handleDone() {
    if (mode === "batch" && batchList.length > 0) {
      onAdd(batchList);
    }
    onClose();
  }

  function handleAddContact(contact: Contacts.ExistingContact) {
    const rawPhone = contact.phoneNumbers?.[0]?.number ?? "";
    const normalized = normalizePhone(rawPhone);
    if (!normalized) return;

    const person: AddedPerson = {
      phone: normalized,
      name: contact.name || undefined,
      source: "contacts",
    };

    if (mode === "batch") {
      if (batchList.some((p) => p.phone === normalized)) return;
      setBatchList((prev) => [...prev, person]);
    } else {
      onAdd([person]);
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.phoneNumbers?.[0]?.number ?? "").includes(q)
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{copy["add_people.title"]}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === "phone" && styles.tabActive]}
            onPress={() => handleTabPress("phone")}
          >
            <Text style={[styles.tabText, tab === "phone" && styles.tabTextActive]}>
              {copy["add_people.tab_phone"]}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "contacts" && styles.tabActive]}
            onPress={() => handleTabPress("contacts")}
          >
            <Text style={[styles.tabText, tab === "contacts" && styles.tabTextActive]}>
              {copy["add_people.tab_contacts"]}
            </Text>
          </Pressable>
        </View>

        {/* Phone Tab */}
        {tab === "phone" && (
          <View style={styles.tabContent}>
            <PhoneInput
              value={phoneInput}
              onChangeDigits={(digits) => {
                setPhoneInput(digits);
                setPhoneError(null);
              }}
              style={styles.input}
              autoFocus
            />
            <TextInput
              style={styles.input}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder={copy["add_people.nickname_placeholder"]}
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              onSubmitEditing={handleAddPhone}
            />
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
            <StoneButton
              label={copy["add_people.add"]}
              onPress={handleAddPhone}
              style={styles.addBtn}
            />

            {mode === "batch" && batchList.length > 0 && (
              <FlatList
                data={batchList}
                keyExtractor={(item) => item.phone}
                style={styles.batchList}
                renderItem={({ item }) => (
                  <View style={styles.batchRow}>
                    <View style={styles.batchInfo}>
                      {item.name && (
                        <Text style={styles.batchName}>{item.name}</Text>
                      )}
                      <Text style={styles.batchPhone}>{item.phone}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveFromBatch(item.phone)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* Contacts Tab */}
        {tab === "contacts" && (
          <View style={styles.tabContent}>
            {contactsPermission === "denied" && (
              <Text style={styles.permissionText}>
                {copy["add_people.contacts_permission"]}
              </Text>
            )}
            {contactsPermission !== "denied" && (
              <>
                <TextInput
                  style={styles.input}
                  value={contactSearch}
                  onChangeText={setContactSearch}
                  placeholder={copy["add_people.contacts_search"]}
                  placeholderTextColor={COLORS.muted}
                />
                {contactsLoading && (
                  <Text style={styles.mutedText}>Loading contacts...</Text>
                )}
                {!contactsLoading && filteredContacts.length === 0 && (
                  <Text style={styles.mutedText}>
                    {copy["add_people.contacts_empty"]}
                  </Text>
                )}
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id}
                  style={styles.contactsList}
                  renderItem={({ item }) => {
                    const rawPhone = item.phoneNumbers?.[0]?.number ?? "";
                    const normalized = normalizePhone(rawPhone);
                    const alreadyAdded =
                      normalized != null &&
                      batchList.some((p) => p.phone === normalized);
                    return (
                      <TouchableOpacity
                        style={[styles.contactRow, alreadyAdded && styles.contactAdded]}
                        onPress={() => !alreadyAdded && handleAddContact(item)}
                        activeOpacity={alreadyAdded ? 1 : 0.7}
                      >
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>{item.name}</Text>
                          <Text style={styles.contactPhone}>{rawPhone}</Text>
                        </View>
                        {alreadyAdded && (
                          <Text style={styles.alreadyConnectedText}>
                            {copy["add_people.already_connected"]}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            )}
          </View>
        )}

        {/* Bottom bar */}
        {mode === "batch" && (
          <View style={styles.bottomBar}>
            <StoneButton
              label={`${copy["add_people.done"]}${batchList.length > 0 ? ` (${batchList.length})` : ""}`}
              onPress={handleDone}
              style={styles.doneBtn}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 28,
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontFamily: "VT323",
    fontSize: 22,
    color: COLORS.muted,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.danger,
    marginBottom: 8,
  },
  addBtn: {
    alignSelf: "stretch",
    marginBottom: 16,
  },
  batchList: {
    flex: 1,
  },
  batchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  batchPhone: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  removeBtn: {
    padding: 8,
  },
  removeBtnText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.danger,
  },
  permissionText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  mutedText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 24,
  },
  contactsList: {
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactAdded: {
    opacity: 0.5,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.text,
  },
  contactPhone: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  alreadyConnectedText: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneBtn: {
    alignSelf: "stretch",
  },
});
