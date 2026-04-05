import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, ActivityIndicator, Modal, BackHandler, Platform, Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { colors } from "@/constants/colors";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/context/AuthContext";
import { api } from "@/services/api";
import PasswordChecks from "@/components/auth/PasswordChecks";

WebBrowser.maybeCompleteAuthSession();

function useKeyboardHeight() {
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s1 = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
    const s2 = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);
  return kbHeight;
}

type ProfileView = "login" | "register" | "forgot-email" | "forgot-code" | "verify" | "profile" | "settings" | "google-register";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/;
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

function formatDate(d: string | undefined | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function translateError(err: string, t: any): string {
  if (err.includes("Incorrect password")) return t.settings.saveError;
  if (err.includes("Email already")) return t.register.emailTaken;
  if (err.includes("sername already") || err.includes("sername")) return t.register.usernameError;
  return err;
}

export default function ProfileTab() {
  const { lang, setLang, t } = useLang();
  const { user, accessToken, isLoading, login, logout, updateUser } = useAuth();
  const [view, setView] = useState<ProfileView>("login");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [googleData, setGoogleData] = useState<{ googleId: string; email: string; firstName: string; lastName: string } | null>(null);

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Set initial view based on auth state
  useEffect(() => {
    if (user) { if (view === "login" || view === "register") setView("profile"); }
    else { if (view === "profile" || view === "settings") setView("login"); }
  }, [user]);

  // Fix 1: Double-tap on Profile tab resets to root
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    const unsub = parent.addListener("tabPress", () => {
      if (isFocused) {
        if (user) setView("profile");
        else setView("login");
      }
    });
    return unsub;
  }, [navigation, isFocused, user]);

  // Fix 3: Android back button goes settings → profile (not exit)
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isFocused) return false;
      if (view === "settings") { setView("profile"); return true; }
      if (view === "register" || view === "forgot-email" || view === "forgot-code" || view === "verify" || view === "google-register") {
        if (user) setView("profile"); else setView("login");
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [view, user, isFocused]);

  if (isLoading) {
    return <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  const handleLangChange = (newLang: "en" | "fr") => {
    setLang(newLang);
    if (user && accessToken) api.auth.updateLang(accessToken, { lang: newLang });
  };

  const goToVerify = (email: string) => { setVerifyEmail(email); setView("verify"); };
  const goToGoogleRegister = (data: typeof googleData) => { setGoogleData(data); setView("google-register"); };
  const goToForgot = () => { setView("forgot-email"); };

  const kbHeight = useKeyboardHeight();

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.headerTitle}>{view === "settings" ? t.settings.title : t.tabs.profile}</Text>
        <View style={s.langSwitch}>
          <TouchableOpacity style={[s.langBtn, lang === "en" && s.langActive]} onPress={() => handleLangChange("en")}><Text style={s.flag}>🇬🇧</Text></TouchableOpacity>
          <TouchableOpacity style={[s.langBtn, lang === "fr" && s.langActive]} onPress={() => handleLangChange("fr")}><Text style={s.flag}>🇫🇷</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgGray }}
        contentContainerStyle={[s.content, { paddingBottom: kbHeight > 0 ? kbHeight + 40 : 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === "login" && <LoginSection onSwitchRegister={() => setView("register")} onSwitchForgot={goToForgot} onNeedsVerify={goToVerify} onGoogleRegister={goToGoogleRegister} />}
        {view === "register" && <RegisterSection onSwitchLogin={() => setView("login")} onNeedsVerify={goToVerify} onGoogleRegister={goToGoogleRegister} />}
        {view === "forgot-email" && <ForgotEmailSection onSwitchLogin={() => setView("login")} onCodeSent={(e) => { setVerifyEmail(e); setView("forgot-code"); }} />}
        {view === "forgot-code" && <ForgotCodeSection email={verifyEmail} onSuccess={() => setView("login")} onBack={() => setView("forgot-email")} />}
        {view === "verify" && <VerifySection email={verifyEmail} onBack={() => setView("login")} />}
        {view === "google-register" && googleData && <GoogleRegisterSection data={googleData} onBack={() => setView("login")} />}
        {view === "profile" && <ConnectedProfile onSettings={() => setView("settings")} />}
        {view === "settings" && <SettingsSection onBack={() => setView("profile")} onForgot={goToForgot} />}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ====== CONNECTED PROFILE ====== */
function ConnectedProfile({ onSettings }: { onSettings: () => void }) {
  const { t } = useLang();
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <View style={{ alignItems: "center", paddingTop: 24 }}>
      <View style={s.avatarCircle}><Text style={s.avatarText}>{user.first_name[0]}{user.last_name[0]}</Text></View>
      <Text style={s.profileName}>{user.first_name} {user.last_name}</Text>
      <Text style={s.profileEmail}>{user.email}</Text>
      <Text style={s.profileMeta}>@{user.username}</Text>
      <TouchableOpacity style={s.settingsBtn} onPress={onSettings}><Text style={s.settingsBtnText}>⚙️ {t.profile.settings}</Text></TouchableOpacity>
      <TouchableOpacity style={s.logoutBtn} onPress={logout}><Text style={s.logoutText}>{t.profile.logout}</Text></TouchableOpacity>
    </View>
  );
}

/* ====== SETTINGS ====== */
function SettingsSection({ onBack, onForgot }: { onBack: () => void; onForgot: () => void }) {
  const { t } = useLang(); const { user, accessToken, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState<Record<string, boolean>>({}); const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [confirmPw, setConfirmPw] = useState(""); const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false); const [saveError, setSaveError] = useState(""); const [saveLoading, setSaveLoading] = useState(false);
  const [deletePw, setDeletePw] = useState(""); const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteError, setDeleteError] = useState(""); const [showDeleteModal, setShowDeleteModal] = useState(false); const [deleteLoading, setDeleteLoading] = useState(false);
  if (!user || !accessToken) return null;

  const fields = [
    { key: "first_name", label: t.settings.firstName, value: user.first_name },
    { key: "last_name", label: t.settings.lastName, value: user.last_name },
    { key: "username", label: t.settings.username, value: user.username },
    { key: "id", label: t.settings.id, value: user.id.slice(0, 8).toUpperCase(), editable: false },
    { key: "birth_date", label: t.settings.birthDate, value: formatDate(user.birth_date), type: "date" },
    { key: "email", label: t.settings.email, value: user.email, type: "email" },
    { key: "new_password", label: t.settings.password, value: t.settings.passwordHidden, type: "password" },
  ];

  const startEdit = (key: string, val: string) => { setEditing(p => ({ ...p, [key]: true })); setEditValues(p => ({ ...p, [key]: key === "new_password" ? "" : val })); setSaveSuccess(false); setSaveError(""); };
  const cancelEdit = (key: string) => { setEditing(p => ({ ...p, [key]: false })); setEditValues(p => { const c = { ...p }; delete c[key]; return c; }); };
  const hasEdits = Object.values(editing).some(Boolean);

  const handleSave = async () => {
    setSaveSuccess(false); setSaveError("");
    if (!confirmPw) { setSaveError(t.settings.saveError); return; }
    const updates: Record<string, string> = {};
    for (const [key, isEd] of Object.entries(editing)) { if (isEd && editValues[key] !== undefined && editValues[key] !== "") updates[key] = editValues[key]; }
    if (Object.keys(updates).length === 0) return;
    setSaveLoading(true);
    const res = await api.auth.updateProfile(accessToken, { password: confirmPw, updates });
    setSaveLoading(false);
    if (res.error) { setSaveError(translateError(res.error, t)); return; }
    if (res.data?.user) updateUser(res.data.user as User);
    setSaveSuccess(true); setEditing({}); setEditValues({}); setConfirmPw("");
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    const res = await api.auth.deleteAccount(accessToken, { password: deletePw });
    setDeleteLoading(false);
    if (res.error) { setShowDeleteModal(false); setDeleteError(translateError(res.error, t)); return; }
    setShowDeleteModal(false); await logout();
  };

  return (
    <View>
      <TouchableOpacity onPress={onBack}><Text style={s.linkText}>{t.settings.back}</Text></TouchableOpacity>
      {saveSuccess && <View style={s.successBox}><Text style={s.successText}>✓ {t.settings.saveSuccess}</Text></View>}
      <Text style={[s.title, { marginTop: 12 }]}>{t.settings.accountInfo}</Text>
      <View style={s.card}>
        {fields.map(f => (
          <View key={f.key} style={s.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              {editing[f.key] ? <TextInput style={s.fieldInput} value={editValues[f.key] || ""} secureTextEntry={f.type === "password"} onChangeText={v => setEditValues(p => ({ ...p, [f.key]: v }))} autoFocus keyboardType={f.type === "email" ? "email-address" : "default"} />
                : <Text style={s.fieldValue}>{f.value}</Text>}
            </View>
            {f.editable !== false && (editing[f.key]
              ? <TouchableOpacity onPress={() => cancelEdit(f.key)}><Text style={s.cancelText}>{t.settings.cancel}</Text></TouchableOpacity>
              : <TouchableOpacity onPress={() => startEdit(f.key, f.value)}><Text style={s.editText}>{t.settings.edit}</Text></TouchableOpacity>)}
          </View>
        ))}
      </View>
      {hasEdits && (
        <View style={s.card}>
          <Text style={s.label}>{t.settings.confirmPassword}</Text>
          <View><TextInput style={[s.input, { paddingRight: 44 }]} placeholder={t.settings.confirmPasswordPlaceholder} placeholderTextColor="#bbb" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry={!showConfirmPw} />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirmPw(!showConfirmPw)}><Text style={{ fontSize: 16 }}>{showConfirmPw ? "🙈" : "👁️"}</Text></TouchableOpacity></View>
          <TouchableOpacity onPress={onForgot}><Text style={[s.linkText, { marginTop: 4 }]}>{t.settings.forgotPassword}</Text></TouchableOpacity>
          <TouchableOpacity style={[s.submitBtn, { marginTop: 14 }]} onPress={handleSave} disabled={saveLoading}>
            {saveLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.settings.save}</Text>}
          </TouchableOpacity>
          {saveError !== "" && <Text style={s.errorTextMsg}>{saveError}</Text>}
        </View>
      )}
      <View style={s.dangerCard}>
        <Text style={s.dangerTitle}>{t.settings.deleteAccount}</Text>
        <Text style={s.dangerText}>{t.settings.deleteWarning}</Text>
        <Text style={s.label}>{t.settings.deletePassword}</Text>
        <View><TextInput style={[s.input, { paddingRight: 44 }]} placeholder={t.settings.deletePasswordPlaceholder} placeholderTextColor="#bbb" value={deletePw} onChangeText={setDeletePw} secureTextEntry={!showDeletePw} />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowDeletePw(!showDeletePw)}><Text style={{ fontSize: 16 }}>{showDeletePw ? "🙈" : "👁️"}</Text></TouchableOpacity></View>
        <TouchableOpacity onPress={onForgot}><Text style={[s.linkText, { marginTop: 4 }]}>{t.settings.forgotPassword}</Text></TouchableOpacity>
        {deleteError !== "" && <Text style={s.errorTextMsg}>{deleteError}</Text>}
        <TouchableOpacity style={s.deleteBtn} onPress={() => { if (!deletePw) { setDeleteError(t.settings.deleteError); return; } setDeleteError(""); setShowDeleteModal(true); }}>
          <Text style={s.deleteBtnText}>{t.settings.deleteBtn}</Text></TouchableOpacity>
      </View>
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={s.modalOverlay}><View style={s.modal}>
          <Text style={s.modalTitle}>{t.settings.deleteModalTitle}</Text><Text style={s.modalText}>{t.settings.deleteModalText}</Text>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowDeleteModal(false)}><Text style={s.modalCancelText}>{t.settings.deleteModalCancel}</Text></TouchableOpacity>
            <TouchableOpacity style={s.modalConfirmBtn} onPress={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalConfirmText}>{t.settings.deleteModalConfirm}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

/* ====== LOGIN ====== */
function LoginSection({ onSwitchRegister, onSwitchForgot, onNeedsVerify, onGoogleRegister }: {
  onSwitchRegister: () => void; onSwitchForgot: () => void; onNeedsVerify: (e: string) => void; onGoogleRegister: (d: any) => void;
}) {
  const { t } = useLang(); const { login } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); const [touchedEmail, setTouchedEmail] = useState(false); const [touchedPw, setTouchedPw] = useState(false);
  const [serverError, setServerError] = useState(""); const [loading, setLoading] = useState(false);
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({ expoClientId: GOOGLE_CLIENT_ID, webClientId: GOOGLE_CLIENT_ID, androidClientId: GOOGLE_CLIENT_ID, iosClientId: GOOGLE_CLIENT_ID });
  useEffect(() => { AsyncStorage.getItem("nbk-remember-email").then(saved => { if (saved) { setEmail(saved); setRememberMe(true); } }); }, []);
  useEffect(() => { if (googleResponse?.type === "success" && googleResponse.authentication?.accessToken) { (async () => { setServerError(""); setLoading(true); const res = await api.auth.google({ credential: googleResponse.authentication!.accessToken }); setLoading(false); if (res.error) { setServerError(res.error); return; } if (res.data?.isExistingUser && res.data.accessToken && res.data.user) login(res.data.accessToken, res.data.user as any); else if (res.data?.googleData) onGoogleRegister(res.data.googleData); })(); } }, [googleResponse]);
  const emailValid = emailRegex.test(email);
  const handleSubmit = async () => { setTouchedEmail(true); setTouchedPw(true); setServerError(""); if (!emailValid) return; setLoading(true); const res = await api.auth.login({ email, password }); setLoading(false); if (res.error) { if (res.data && (res.data as any).needsVerification) { onNeedsVerify(email); return; } setServerError(t.login.error); return; } if (res.data) { if (rememberMe) AsyncStorage.setItem("nbk-remember-email", email); else AsyncStorage.removeItem("nbk-remember-email"); login(res.data.accessToken, res.data.user as any); } };
  return (<View><Text style={s.title}>{t.login.title}</Text><Text style={s.subtitle}>{t.login.subtitle}</Text>
    <TouchableOpacity style={s.googleBtn} onPress={() => promptGoogleAsync()}><Text style={s.googleG}>G</Text><Text style={s.googleBtnText}>{t.login.googleBtn}</Text></TouchableOpacity>
    <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>{t.login.or}</Text><View style={s.dividerLine} /></View>
    {serverError !== "" && <View style={s.errorBox}><Text style={s.errorBoxText}>{serverError}</Text></View>}
    <Text style={s.label}>{t.login.email}</Text><TextInput style={[s.input, touchedEmail && !emailValid && email.length > 0 && s.inputError]} placeholder={t.login.emailPlaceholder} placeholderTextColor="#bbb" value={email} onChangeText={setEmail} onBlur={() => setTouchedEmail(true)} keyboardType="email-address" autoCapitalize="none" />{touchedEmail && !emailValid && email.length > 0 && <Text style={s.errorText}>{t.login.emailError}</Text>}
    <Text style={[s.label, { marginTop: 14 }]}>{t.login.password}</Text><View><TextInput style={[s.input, { paddingRight: 44 }]} placeholder={t.login.passwordPlaceholder} placeholderTextColor="#bbb" value={password} onChangeText={v => { setPassword(v); setTouchedPw(true); }} secureTextEntry={!showPw} /><TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}><Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text></TouchableOpacity></View>
    {touchedPw && password.length > 0 && <PasswordChecks password={password} />}
    <View style={s.optionsRow}><View style={s.rememberRow}><Switch value={rememberMe} onValueChange={setRememberMe} trackColor={{ true: colors.accent, false: "#ddd" }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} /><Text style={s.optionText}>{t.login.rememberMe}</Text></View><TouchableOpacity onPress={onSwitchForgot}><Text style={s.linkText}>{t.login.forgotPassword}</Text></TouchableOpacity></View>
    <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.login.submit}</Text>}</TouchableOpacity>
    <View style={s.bottomRow}><Text style={s.bottomText}>{t.login.noAccount} </Text><TouchableOpacity onPress={onSwitchRegister}><Text style={s.linkText}>{t.login.register}</Text></TouchableOpacity></View></View>);
}

/* ====== REGISTER ====== */
function RegisterSection({ onSwitchLogin, onNeedsVerify, onGoogleRegister }: { onSwitchLogin: () => void; onNeedsVerify: (e: string) => void; onGoogleRegister: (d: any) => void }) {
  const { t, lang } = useLang(); const { login } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", birthDate: "", password: "" });
  const [showPw, setShowPw] = useState(false); const [touchedPw, setTouchedPw] = useState(false); const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState(""); const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null); const [checkingUsername, setCheckingUsername] = useState(false); const timer = useRef<NodeJS.Timeout | null>(null);
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({ expoClientId: GOOGLE_CLIENT_ID, webClientId: GOOGLE_CLIENT_ID, androidClientId: GOOGLE_CLIENT_ID, iosClientId: GOOGLE_CLIENT_ID });
  useEffect(() => { if (googleResponse?.type === "success" && googleResponse.authentication?.accessToken) { (async () => { setLoading(true); const res = await api.auth.google({ credential: googleResponse.authentication!.accessToken }); setLoading(false); if (res.data?.isExistingUser && res.data.accessToken) login(res.data.accessToken, res.data.user as any); else if (res.data?.googleData) onGoogleRegister(res.data.googleData); })(); } }, [googleResponse]);
  useEffect(() => { if (form.username.length < 3) { setUsernameAvailable(null); return; } setCheckingUsername(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(async () => { const res = await api.auth.checkUsername(form.username); if (res.data) setUsernameAvailable(res.data.available); setCheckingUsername(false); }, 500); }, [form.username]);
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v })); const touch = (k: string) => setTouched(p => ({ ...p, [k]: true }));
  const fnValid = form.firstName.length === 0 || nameRegex.test(form.firstName); const lnValid = form.lastName.length === 0 || nameRegex.test(form.lastName); const emailValid = emailRegex.test(form.email);
  const checks = { length: form.password.length >= 8, uppercase: /[A-Z]/.test(form.password), lowercase: /[a-z]/.test(form.password), number: /[0-9]/.test(form.password), special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) };
  const allChecks = Object.values(checks).every(Boolean);
  const handleSubmit = async () => { setTouchedPw(true); setTouched({ firstName: true, lastName: true, email: true, username: true }); setServerError(""); if (!nameRegex.test(form.firstName) || !nameRegex.test(form.lastName) || !emailValid || !allChecks || form.username.length < 3 || usernameAvailable === false) return; setLoading(true); const res = await api.auth.register({ email: form.email, password: form.password, first_name: form.firstName, last_name: form.lastName, username: form.username, birth_date: form.birthDate || undefined, lang }); setLoading(false); if (res.error) { if (res.error.includes("Email")) setServerError(t.register.emailTaken); else if (res.error.includes("sername")) setServerError(t.register.usernameError); else setServerError(res.error); return; } onNeedsVerify(form.email); };
  return (<View><Text style={s.title}>{t.register.title}</Text><Text style={s.subtitle}>{t.register.subtitle}</Text>
    <TouchableOpacity style={s.googleBtn} onPress={() => promptGoogleAsync()}><Text style={s.googleG}>G</Text><Text style={s.googleBtnText}>{t.register.googleBtn}</Text></TouchableOpacity>
    <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>{t.register.or}</Text><View style={s.dividerLine} /></View>
    {serverError !== "" && <View style={s.errorBox}><Text style={s.errorBoxText}>{serverError}</Text></View>}
    <View style={s.row}><View style={s.halfField}><Text style={s.label}>{t.register.firstName}</Text><TextInput style={[s.input, touched.firstName && form.firstName.length > 0 && !fnValid && s.inputError]} placeholder={t.register.firstNamePlaceholder} placeholderTextColor="#bbb" value={form.firstName} onChangeText={v => update("firstName", v)} onBlur={() => touch("firstName")} />{touched.firstName && form.firstName.length > 0 && !fnValid && <Text style={s.errorText}>{t.register.nameError}</Text>}</View>
      <View style={s.halfField}><Text style={s.label}>{t.register.lastName}</Text><TextInput style={[s.input, touched.lastName && form.lastName.length > 0 && !lnValid && s.inputError]} placeholder={t.register.lastNamePlaceholder} placeholderTextColor="#bbb" value={form.lastName} onChangeText={v => update("lastName", v)} onBlur={() => touch("lastName")} />{touched.lastName && form.lastName.length > 0 && !lnValid && <Text style={s.errorText}>{t.register.nameError}</Text>}</View></View>
    <View style={s.field}><Text style={s.label}>{t.register.username}</Text><TextInput style={[s.input, form.username.length >= 3 && usernameAvailable === false && s.inputError, form.username.length >= 3 && usernameAvailable === true && s.inputOk]} placeholder={t.register.usernamePlaceholder} placeholderTextColor="#bbb" value={form.username} onChangeText={v => update("username", v.replace(/\s/g, "").toLowerCase())} autoCapitalize="none" />{checkingUsername && <Text style={s.checkText}>...</Text>}{!checkingUsername && form.username.length >= 3 && usernameAvailable === false && <Text style={s.errorText}>{t.register.usernameError}</Text>}{!checkingUsername && form.username.length >= 3 && usernameAvailable === true && <Text style={s.okText}>✓</Text>}</View>
    <View style={s.field}><Text style={s.label}>{t.register.email}</Text><TextInput style={[s.input, touched.email && form.email.length > 0 && !emailValid && s.inputError]} placeholder={t.register.emailPlaceholder} placeholderTextColor="#bbb" value={form.email} onChangeText={v => update("email", v)} onBlur={() => touch("email")} keyboardType="email-address" autoCapitalize="none" />{touched.email && form.email.length > 0 && !emailValid && <Text style={s.errorText}>{t.register.emailError}</Text>}</View>
    <View style={s.field}><Text style={s.label}>{t.register.birthDate}</Text><TextInput style={s.input} placeholder={t.register.birthDatePlaceholder} placeholderTextColor="#bbb" value={form.birthDate} onChangeText={v => { let c = v.replace(/[^0-9/]/g, ""); if (c.length === 2 && !c.includes("/")) c += "/"; if (c.length === 5 && c.split("/").length === 2) c += "/"; if (c.length <= 10) update("birthDate", c); }} keyboardType="numeric" maxLength={10} /></View>
    <View style={s.field}><Text style={s.label}>{t.register.password}</Text><View><TextInput style={[s.input, { paddingRight: 44 }]} placeholder={t.register.passwordPlaceholder} placeholderTextColor="#bbb" value={form.password} onChangeText={v => { update("password", v); setTouchedPw(true); }} secureTextEntry={!showPw} /><TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}><Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text></TouchableOpacity></View>{touchedPw && form.password.length > 0 && <PasswordChecks password={form.password} />}</View>
    <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.register.submit}</Text>}</TouchableOpacity>
    <View style={s.bottomRow}><Text style={s.bottomText}>{t.register.hasAccount} </Text><TouchableOpacity onPress={onSwitchLogin}><Text style={s.linkText}>{t.register.login}</Text></TouchableOpacity></View></View>);
}

/* ====== VERIFY ====== */
function VerifySection({ email, onBack }: { email: string; onBack: () => void }) {
  const { t } = useLang(); const { login } = useAuth();
  const [code, setCode] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(false); const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { if (code.length !== 6) return; setError(""); setLoading(true); const res = await api.auth.verifyEmail({ email, code }); setLoading(false); if (res.error) { setError(t.verify.error); return; } if (res.data) { login(res.data.accessToken, res.data.user as any); setSuccess(true); } };
  return (<View><Text style={s.title}>{t.verify.title}</Text><Text style={s.subtitle}>{t.verify.subtitle} <Text style={{ fontWeight: "700" }}>{email}</Text></Text>
    {success ? <View style={s.successBox}><Text style={s.successText}>✓ {t.verify.success}</Text></View> : <>{error !== "" && <View style={s.errorBox}><Text style={s.errorBoxText}>{error}</Text></View>}
      <TextInput style={s.codeInput} placeholder={t.verify.codePlaceholder} placeholderTextColor="#ddd" value={code} onChangeText={v => setCode(v.replace(/\D/g, "").slice(0, 6))} maxLength={6} keyboardType="number-pad" />
      <TouchableOpacity style={[s.submitBtn, { marginTop: 16 }]} onPress={handleSubmit} disabled={loading || code.length !== 6}>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.verify.submit}</Text>}</TouchableOpacity>
      <TouchableOpacity style={{ alignItems: "center", marginTop: 14 }} onPress={() => api.auth.resendCode({ email })}><Text style={s.linkText}>{t.verify.resend}</Text></TouchableOpacity></>}
    <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onBack}><Text style={[s.linkText, { color: colors.textGray }]}>← {t.forgot.backToLogin}</Text></TouchableOpacity></View>);
}

/* ====== FORGOT EMAIL ====== */
function ForgotEmailSection({ onSwitchLogin, onCodeSent }: { onSwitchLogin: () => void; onCodeSent: (e: string) => void }) {
  const { t, lang } = useLang();
  const [email, setEmail] = useState(""); const [touchedEmail, setTouchedEmail] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const emailValid = emailRegex.test(email);
  const handleSubmit = async () => { setTouchedEmail(true); setError(""); if (!emailValid) return; setLoading(true); const res = await api.auth.forgotPassword({ email, lang }); setLoading(false); if (res.error) { setError(res.error); return; } onCodeSent(email); };
  return (<View><Text style={s.title}>{t.forgot.title}</Text><Text style={s.subtitle}>{t.forgot.subtitle}</Text>
    {error !== "" && <View style={s.errorBox}><Text style={s.errorBoxText}>{error}</Text></View>}
    <Text style={s.label}>{t.forgot.email}</Text><TextInput style={[s.input, touchedEmail && !emailValid && email.length > 0 && s.inputError]} placeholder={t.forgot.emailPlaceholder} placeholderTextColor="#bbb" value={email} onChangeText={setEmail} onBlur={() => setTouchedEmail(true)} keyboardType="email-address" autoCapitalize="none" />{touchedEmail && !emailValid && email.length > 0 && <Text style={s.errorText}>{t.forgot.emailError}</Text>}
    <TouchableOpacity style={[s.submitBtn, { marginTop: 16 }]} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.forgot.submit}</Text>}</TouchableOpacity>
    <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onSwitchLogin}><Text style={s.linkText}>← {t.forgot.backToLogin}</Text></TouchableOpacity></View>);
}

/* ====== FORGOT CODE ====== */
function ForgotCodeSection({ email, onSuccess, onBack }: { email: string; onSuccess: () => void; onBack: () => void }) {
  const { t } = useLang();
  const [code, setCode] = useState(""); const [password, setPassword] = useState(""); const [showPw, setShowPw] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false); const [loading, setLoading] = useState(false);
  const checks = { length: password.length >= 8, uppercase: /[A-Z]/.test(password), lowercase: /[a-z]/.test(password), number: /[0-9]/.test(password), special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) };
  const allChecks = Object.values(checks).every(Boolean);
  const handleSubmit = async () => { setError(""); if (code.length !== 6 || !allChecks) return; setLoading(true); const res = await api.auth.resetPassword({ email, code, password }); setLoading(false); if (res.error) { setError(t.forgot.codeError); return; } setSuccess(true); setTimeout(onSuccess, 2000); };
  return (<View><Text style={s.title}>{t.forgot.title}</Text><Text style={s.subtitle}>{t.forgot.codeSent}</Text>
    {success ? <View style={s.successBox}><Text style={s.successText}>✓ {t.forgot.success}</Text></View> : <>{error !== "" && <View style={s.errorBox}><Text style={s.errorBoxText}>{error}</Text></View>}
      <Text style={s.label}>{t.forgot.code}</Text><TextInput style={s.codeInput} placeholder={t.forgot.codePlaceholder} placeholderTextColor="#ddd" value={code} onChangeText={v => setCode(v.replace(/\D/g, "").slice(0, 6))} maxLength={6} keyboardType="number-pad" />
      <Text style={[s.label, { marginTop: 14 }]}>{t.forgot.newPassword}</Text><View><TextInput style={[s.input, { paddingRight: 44 }]} placeholder={t.forgot.newPasswordPlaceholder} placeholderTextColor="#bbb" value={password} onChangeText={setPassword} secureTextEntry={!showPw} /><TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}><Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text></TouchableOpacity></View>
      {password.length > 0 && <PasswordChecks password={password} />}
      <TouchableOpacity style={[s.submitBtn, { marginTop: 16 }]} onPress={handleSubmit} disabled={loading || code.length !== 6 || !allChecks}>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.forgot.resetSubmit}</Text>}</TouchableOpacity></>}
    <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onBack}><Text style={[s.linkText, { color: colors.textGray }]}>← {t.forgot.backToLogin}</Text></TouchableOpacity></View>);
}

/* ====== GOOGLE REGISTER ====== */
function GoogleRegisterSection({ data, onBack }: { data: { googleId: string; email: string; firstName: string; lastName: string }; onBack: () => void }) {
  const { t } = useLang(); const { login } = useAuth();
  const [username, setUsername] = useState(""); const [birthDate, setBirthDate] = useState(""); const [password, setPassword] = useState(""); const [showPw, setShowPw] = useState(false); const [touchedPw, setTouchedPw] = useState(false);
  const [serverError, setServerError] = useState(""); const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null); const [checkingUsername, setCheckingUsername] = useState(false); const timer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { if (username.length < 3) { setUsernameAvailable(null); return; } setCheckingUsername(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(async () => { const res = await api.auth.checkUsername(username); if (res.data) setUsernameAvailable(res.data.available); setCheckingUsername(false); }, 500); }, [username]);
  const checks = { length: password.length >= 8, uppercase: /[A-Z]/.test(password), lowercase: /[a-z]/.test(password), number: /[0-9]/.test(password), special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) };
  const allChecks = Object.values(checks).every(Boolean);
  const handleSubmit = async () => { setTouchedPw(true); setServerError(""); if (username.length < 3 || usernameAvailable === false || !allChecks) return; setLoading(true); const res = await api.auth.googleRegister({ googleId: data.googleId, email: data.email, firstName: data.firstName, lastName: data.lastName, username, password, birthDate: birthDate || undefined }); setLoading(false); if (res.error) { setServerError(res.error.includes("sername") ? t.googleRegister.usernameError : res.error); return; } if (res.data) login(res.data.accessToken, res.data.user as any); };
  return (<View><Text style={s.title}>{t.googleRegister.title}</Text><Text style={s.subtitle}>{t.googleRegister.subtitle}</Text>
    <View style={s.googleInfoBox}><View style={s.googleInfoAvatar}><Text style={s.googleInfoInitials}>{data.firstName[0]}{data.lastName[0]}</Text></View><View><Text style={s.googleInfoName}>{data.firstName} {data.lastName}</Text><Text style={s.googleInfoEmail}>{data.email}</Text></View></View>
    {serverError !== "" && <View style={s.errorBox}><Text style={s.errorBoxText}>{serverError}</Text></View>}
    <View style={s.field}><Text style={s.label}>{t.googleRegister.username}</Text><TextInput style={[s.input, username.length >= 3 && usernameAvailable === false && s.inputError, username.length >= 3 && usernameAvailable === true && s.inputOk]} placeholder={t.googleRegister.usernamePlaceholder} placeholderTextColor="#bbb" value={username} onChangeText={v => setUsername(v.replace(/\s/g, "").toLowerCase())} autoCapitalize="none" />{checkingUsername && <Text style={s.checkText}>...</Text>}{!checkingUsername && username.length >= 3 && usernameAvailable === false && <Text style={s.errorText}>{t.googleRegister.usernameError}</Text>}{!checkingUsername && username.length >= 3 && usernameAvailable === true && <Text style={s.okText}>✓</Text>}</View>
    <View style={s.field}><Text style={s.label}>{t.googleRegister.birthDate}</Text><TextInput style={s.input} placeholder={t.googleRegister.birthDatePlaceholder} placeholderTextColor="#bbb" value={birthDate} onChangeText={v => { let c = v.replace(/[^0-9/]/g, ""); if (c.length === 2 && !c.includes("/")) c += "/"; if (c.length === 5 && c.split("/").length === 2) c += "/"; if (c.length <= 10) setBirthDate(c); }} keyboardType="numeric" maxLength={10} /></View>
    <View style={s.field}><Text style={s.label}>{t.googleRegister.password}</Text><View><TextInput style={[s.input, { paddingRight: 44 }]} placeholder={t.googleRegister.passwordPlaceholder} placeholderTextColor="#bbb" value={password} onChangeText={v => { setPassword(v); setTouchedPw(true); }} secureTextEntry={!showPw} /><TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}><Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text></TouchableOpacity></View>{touchedPw && password.length > 0 && <PasswordChecks password={password} />}</View>
    <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t.googleRegister.submit}</Text>}</TouchableOpacity>
    <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onBack}><Text style={[s.linkText, { color: colors.textGray }]}>← {t.forgot.backToLogin}</Text></TouchableOpacity></View>);
}

/* ====== STYLES ====== */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGray },
  header: { backgroundColor: colors.navyDark, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  langSwitch: { flexDirection: "row", gap: 4 }, langBtn: { padding: 4, borderRadius: 4, borderWidth: 2, borderColor: "transparent", opacity: 0.5 }, langActive: { opacity: 1, borderColor: colors.accent }, flag: { fontSize: 18 },
  content: { padding: 20, paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", color: colors.textDark }, subtitle: { fontSize: 13, color: colors.textGray, marginBottom: 20, lineHeight: 20 },
  googleBtn: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#fff" },
  googleG: { fontSize: 18, fontWeight: "800", color: "#4285F4" }, googleBtnText: { fontSize: 14, fontWeight: "500", color: colors.textDark },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 }, dividerLine: { flex: 1, height: 1, backgroundColor: "#eee" }, dividerText: { fontSize: 12, color: colors.textGray },
  label: { fontSize: 13, fontWeight: "600", color: colors.textDark, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 11, fontSize: 14, color: colors.textDark, backgroundColor: "#fff" },
  inputError: { borderColor: "#E53935" }, inputOk: { borderColor: "#4CAF50" },
  errorText: { fontSize: 11, color: "#E53935", marginTop: 4, fontWeight: "500" }, errorTextMsg: { fontSize: 13, color: "#E53935", marginTop: 8, fontWeight: "500" },
  okText: { fontSize: 11, color: "#4CAF50", marginTop: 4, fontWeight: "500" }, checkText: { fontSize: 11, color: colors.textGray, marginTop: 4 },
  errorBox: { backgroundColor: "#FFF0F0", borderWidth: 1, borderColor: "#FFCDD2", borderRadius: 8, padding: 10, marginBottom: 14 }, errorBoxText: { fontSize: 13, color: "#E53935", fontWeight: "500", textAlign: "center" },
  successBox: { backgroundColor: "#E8F5E9", borderRadius: 10, padding: 14, marginBottom: 16 }, successText: { fontSize: 14, color: "#2E7D32", textAlign: "center", fontWeight: "600" },
  codeInput: { borderWidth: 2, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 28, fontWeight: "700", textAlign: "center", letterSpacing: 10, color: colors.textDark, backgroundColor: "#fff", marginTop: 8 },
  eyeBtn: { position: "absolute", right: 10, top: 10, padding: 4 },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 16 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 4 }, optionText: { fontSize: 13, color: colors.textDark },
  linkText: { fontSize: 13, fontWeight: "500", color: colors.accent },
  submitBtn: { backgroundColor: colors.navyDark, borderRadius: 10, padding: 13, alignItems: "center" }, submitText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  bottomRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 }, bottomText: { fontSize: 13, color: colors.textGray },
  row: { flexDirection: "row", gap: 10 }, halfField: { flex: 1, marginBottom: 12 }, field: { marginBottom: 12 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navyLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }, avatarText: { fontSize: 24, fontWeight: "700", color: colors.accent },
  profileName: { fontSize: 20, fontWeight: "700", color: colors.textDark }, profileEmail: { fontSize: 14, color: colors.textGray, marginTop: 4 }, profileMeta: { fontSize: 13, color: colors.accent, marginTop: 2 },
  settingsBtn: { marginTop: 24, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, backgroundColor: "#fff" }, settingsBtnText: { fontSize: 14, fontWeight: "500", color: colors.textDark },
  logoutBtn: { marginTop: 12, borderWidth: 1, borderColor: "#FFCDD2", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 }, logoutText: { fontSize: 14, fontWeight: "500", color: "#E53935" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#eee", marginBottom: 16 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f3f3" },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: colors.textGray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }, fieldValue: { fontSize: 14, color: colors.textDark },
  fieldInput: { borderWidth: 1, borderColor: colors.accent, borderRadius: 8, padding: 8, fontSize: 14, color: colors.textDark, backgroundColor: "#F8FCFF", maxWidth: 220 },
  editText: { fontSize: 12, fontWeight: "500", color: colors.accent }, cancelText: { fontSize: 12, fontWeight: "500", color: colors.textGray },
  dangerCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#FFCDD2", marginBottom: 16 },
  dangerTitle: { fontSize: 17, fontWeight: "600", color: "#E53935", marginBottom: 6 }, dangerText: { fontSize: 13, color: colors.textGray, marginBottom: 14, lineHeight: 20 },
  deleteBtn: { backgroundColor: "#E53935", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 14 }, deleteBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modal: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#E53935", marginBottom: 12 }, modalText: { fontSize: 14, color: colors.textGray, lineHeight: 22, marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: { flex: 1, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, alignItems: "center" }, modalCancelText: { fontSize: 13, fontWeight: "500", color: colors.textDark },
  modalConfirmBtn: { flex: 1, padding: 12, backgroundColor: "#E53935", borderRadius: 10, alignItems: "center" }, modalConfirmText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  googleInfoBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bgGray, padding: 14, borderRadius: 10, marginBottom: 20 },
  googleInfoAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navyDark, alignItems: "center", justifyContent: "center" },
  googleInfoInitials: { fontSize: 14, fontWeight: "700", color: colors.accent }, googleInfoName: { fontSize: 14, fontWeight: "600", color: colors.textDark }, googleInfoEmail: { fontSize: 12, color: colors.textGray },
});
