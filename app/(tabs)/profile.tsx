import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/constants/colors";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import GoogleLogo from "@/components/auth/GoogleLogo";
import PasswordChecks from "@/components/auth/PasswordChecks";

type ProfileView = "login" | "register" | "forgot-email" | "forgot-code" | "verify";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/;

export default function ProfileTab() {
  const { lang, setLang, t } = useLang();
  const { user, logout, isLoading } = useAuth();
  const [view, setView] = useState<ProfileView>("login");
  const [verifyEmail, setVerifyEmail] = useState("");

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.tabs.profile}</Text>
          <View style={styles.langSwitch}>
            <TouchableOpacity style={[styles.langBtn, lang === "en" && styles.langActive]} onPress={() => setLang("en")}>
              <Text style={styles.flag}>🇬🇧</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langBtn, lang === "fr" && styles.langActive]} onPress={() => setLang("fr")}>
              <Text style={styles.flag}>🇫🇷</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.profileContent}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user.first_name[0]}{user.last_name[0]}
            </Text>
          </View>
          <Text style={styles.profileName}>{t.profile.hello} {user.first_name} !</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileMeta}>@{user.username}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>{t.profile.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const goToVerify = (email: string) => {
    setVerifyEmail(email);
    setView("verify");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.tabs.profile}</Text>
        <View style={styles.langSwitch}>
          <TouchableOpacity style={[styles.langBtn, lang === "en" && styles.langActive]} onPress={() => setLang("en")}>
            <Text style={styles.flag}>🇬🇧</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langBtn, lang === "fr" && styles.langActive]} onPress={() => setLang("fr")}>
            <Text style={styles.flag}>🇫🇷</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgGray }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === "login" && (
          <LoginSection
            onSwitchRegister={() => setView("register")}
            onSwitchForgot={() => setView("forgot-email")}
            onNeedsVerify={goToVerify}
          />
        )}
        {view === "register" && (
          <RegisterSection
            onSwitchLogin={() => setView("login")}
            onNeedsVerify={goToVerify}
          />
        )}
        {view === "forgot-email" && (
          <ForgotEmailSection
            onSwitchLogin={() => setView("login")}
            onCodeSent={(email) => { setVerifyEmail(email); setView("forgot-code"); }}
          />
        )}
        {view === "forgot-code" && (
          <ForgotCodeSection
            email={verifyEmail}
            onSuccess={() => setView("login")}
            onBack={() => setView("forgot-email")}
          />
        )}
        {view === "verify" && (
          <VerifySection email={verifyEmail} onBack={() => setView("login")} />
        )}
      </ScrollView>
    </View>
  );
}

/* ====== LOGIN ====== */
function LoginSection({ onSwitchRegister, onSwitchForgot, onNeedsVerify }: {
  onSwitchRegister: () => void; onSwitchForgot: () => void; onNeedsVerify: (email: string) => void;
}) {
  const { t, lang } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPw, setTouchedPw] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("nbk-remember-email").then((saved) => {
      if (saved) { setEmail(saved); setRememberMe(true); }
    });
  }, []);

  const emailValid = emailRegex.test(email);

  const handleSubmit = async () => {
    setTouchedEmail(true); setTouchedPw(true); setServerError("");
    if (!emailValid) return;

    setLoading(true);
    const res = await api.auth.login({ email, password });
    setLoading(false);

    if (res.error) {
      if (res.data && (res.data as Record<string, unknown>).needsVerification) {
        onNeedsVerify(email);
        return;
      }
      setServerError(t.login.error);
      return;
    }

    if (res.data) {
      if (rememberMe) AsyncStorage.setItem("nbk-remember-email", email);
      else AsyncStorage.removeItem("nbk-remember-email");
      login(res.data.accessToken, res.data.user as Parameters<typeof login>[1]);
    }
  };

  return (
    <View>
      <Text style={styles.title}>{t.login.title}</Text>
      <Text style={styles.subtitle}>{t.login.subtitle}</Text>

      <TouchableOpacity style={styles.googleBtn}>
        <GoogleLogo />
        <Text style={styles.googleText}>{t.login.googleBtn}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t.login.or}</Text>
        <View style={styles.dividerLine} />
      </View>

      {serverError !== "" && <View style={styles.errorBox}><Text style={styles.errorBoxText}>{serverError}</Text></View>}

      <Text style={styles.label}>{t.login.email}</Text>
      <TextInput style={[styles.input, touchedEmail && !emailValid && email.length > 0 && styles.inputError]}
        placeholder={t.login.emailPlaceholder} placeholderTextColor="#bbb" value={email}
        onChangeText={setEmail} onBlur={() => setTouchedEmail(true)}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      {touchedEmail && !emailValid && email.length > 0 && <Text style={styles.errorText}>{t.login.emailError}</Text>}

      <Text style={[styles.label, { marginTop: 14 }]}>{t.login.password}</Text>
      <View>
        <TextInput style={[styles.input, { paddingRight: 44 }]} placeholder={t.login.passwordPlaceholder}
          placeholderTextColor="#bbb" value={password}
          onChangeText={(v) => { setPassword(v); setTouchedPw(true); }} secureTextEntry={!showPw} />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
          <Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>
      {touchedPw && password.length > 0 && <PasswordChecks password={password} />}

      <View style={styles.optionsRow}>
        <View style={styles.rememberRow}>
          <Switch value={rememberMe} onValueChange={setRememberMe}
            trackColor={{ true: colors.accent, false: "#ddd" }} thumbColor={colors.white}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />
          <Text style={styles.optionText}>{t.login.rememberMe}</Text>
        </View>
        <TouchableOpacity onPress={onSwitchForgot}>
          <Text style={styles.linkText}>{t.login.forgotPassword}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitText}>{t.login.submit}</Text>}
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>{t.login.noAccount} </Text>
        <TouchableOpacity onPress={onSwitchRegister}><Text style={styles.linkText}>{t.login.register}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

/* ====== REGISTER ====== */
function RegisterSection({ onSwitchLogin, onNeedsVerify }: {
  onSwitchLogin: () => void; onNeedsVerify: (email: string) => void;
}) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", birthDate: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [touchedPw, setTouchedPw] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  const fnValid = nameRegex.test(form.firstName);
  const lnValid = nameRegex.test(form.lastName);
  const emailValid = emailRegex.test(form.email);
  const checks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
  };
  const allChecks = Object.values(checks).every(Boolean);

  const handleSubmit = async () => {
    setTouchedPw(true);
    setTouched({ firstName: true, lastName: true, email: true, username: true, birthDate: true });
    setServerError("");
    if (!fnValid || !lnValid || !emailValid || !allChecks || form.username.length < 3) return;

    setLoading(true);
    const res = await api.auth.register({
      email: form.email, password: form.password, first_name: form.firstName,
      last_name: form.lastName, username: form.username,
      birth_date: form.birthDate || undefined, lang,
    });
    setLoading(false);

    if (res.error) {
      if (res.error.includes("Email")) setServerError(t.register.emailTaken);
      else if (res.error.includes("sername")) setServerError(t.register.usernameError);
      else setServerError(res.error);
      return;
    }
    onNeedsVerify(form.email);
  };

  return (
    <View>
      <Text style={styles.title}>{t.register.title}</Text>
      <Text style={styles.subtitle}>{t.register.subtitle}</Text>

      <TouchableOpacity style={styles.googleBtn}>
        <GoogleLogo />
        <Text style={styles.googleText}>{t.register.googleBtn}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t.register.or}</Text>
        <View style={styles.dividerLine} />
      </View>

      {serverError !== "" && <View style={styles.errorBox}><Text style={styles.errorBoxText}>{serverError}</Text></View>}

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t.register.firstName}</Text>
          <TextInput style={[styles.input, touched.firstName && form.firstName.length > 0 && !fnValid && styles.inputError]}
            placeholder={t.register.firstNamePlaceholder} placeholderTextColor="#bbb" value={form.firstName}
            onChangeText={(v) => update("firstName", v)} onBlur={() => touch("firstName")} autoComplete="given-name" />
          {touched.firstName && form.firstName.length > 0 && !fnValid && <Text style={styles.errorText}>{t.register.nameError}</Text>}
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t.register.lastName}</Text>
          <TextInput style={[styles.input, touched.lastName && form.lastName.length > 0 && !lnValid && styles.inputError]}
            placeholder={t.register.lastNamePlaceholder} placeholderTextColor="#bbb" value={form.lastName}
            onChangeText={(v) => update("lastName", v)} onBlur={() => touch("lastName")} autoComplete="family-name" />
          {touched.lastName && form.lastName.length > 0 && !lnValid && <Text style={styles.errorText}>{t.register.nameError}</Text>}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.register.username}</Text>
        <TextInput style={styles.input} placeholder={t.register.usernamePlaceholder} placeholderTextColor="#bbb"
          value={form.username} onChangeText={(v) => update("username", v.replace(/\s/g, "").toLowerCase())} autoCapitalize="none" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.register.email}</Text>
        <TextInput style={[styles.input, touched.email && form.email.length > 0 && !emailValid && styles.inputError]}
          placeholder={t.register.emailPlaceholder} placeholderTextColor="#bbb" value={form.email}
          onChangeText={(v) => update("email", v)} onBlur={() => touch("email")}
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        {touched.email && form.email.length > 0 && !emailValid && <Text style={styles.errorText}>{t.register.emailError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.register.birthDate}</Text>
        <TextInput style={styles.input} placeholder={t.register.birthDatePlaceholder} placeholderTextColor="#bbb"
          value={form.birthDate} onChangeText={(v) => {
            let c = v.replace(/[^0-9/]/g, "");
            if (c.length === 2 && !c.includes("/")) c += "/";
            if (c.length === 5 && c.split("/").length === 2) c += "/";
            if (c.length <= 10) update("birthDate", c);
          }} keyboardType="numeric" maxLength={10} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.register.password}</Text>
        <View>
          <TextInput style={[styles.input, { paddingRight: 44 }]} placeholder={t.register.passwordPlaceholder}
            placeholderTextColor="#bbb" value={form.password}
            onChangeText={(v) => { update("password", v); setTouchedPw(true); }} secureTextEntry={!showPw} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
            <Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {touchedPw && form.password.length > 0 && <PasswordChecks password={form.password} />}
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitText}>{t.register.submit}</Text>}
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>{t.register.hasAccount} </Text>
        <TouchableOpacity onPress={onSwitchLogin}><Text style={styles.linkText}>{t.register.login}</Text></TouchableOpacity>
      </View>
      <View style={{ height: 30 }} />
    </View>
  );
}

/* ====== VERIFY ====== */
function VerifySection({ email, onBack }: { email: string; onBack: () => void }) {
  const { t } = useLang();
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (code.length !== 6) return;
    setError(""); setLoading(true);
    const res = await api.auth.verifyEmail({ email, code });
    setLoading(false);

    if (res.error) { setError(t.verify.error); return; }
    if (res.data) {
      login(res.data.accessToken, res.data.user as Parameters<typeof login>[1]);
      setSuccess(true);
    }
  };

  return (
    <View>
      <Text style={styles.title}>{t.verify.title}</Text>
      <Text style={styles.subtitle}>{t.verify.subtitle} <Text style={{ fontWeight: "700" }}>{email}</Text></Text>

      {success ? (
        <View style={styles.successBox}><Text style={styles.successText}>✓ {t.verify.success}</Text></View>
      ) : (
        <>
          {error !== "" && <View style={styles.errorBox}><Text style={styles.errorBoxText}>{error}</Text></View>}
          <TextInput style={styles.codeInput} placeholder={t.verify.codePlaceholder} placeholderTextColor="#ddd"
            value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            maxLength={6} keyboardType="number-pad" />
          <TouchableOpacity style={[styles.submitBtn, { marginTop: 16 }]} onPress={handleSubmit} disabled={loading || code.length !== 6}>
            {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitText}>{t.verify.submit}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: "center", marginTop: 14 }}>
            <Text style={styles.linkText}>{t.verify.resend}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onBack}>
        <Text style={[styles.linkText, { color: colors.textGray }]}>← {t.forgot.backToLogin}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ====== FORGOT EMAIL STEP ====== */
function ForgotEmailSection({ onSwitchLogin, onCodeSent }: {
  onSwitchLogin: () => void; onCodeSent: (email: string) => void;
}) {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailValid = emailRegex.test(email);

  const handleSubmit = async () => {
    setTouchedEmail(true);
    if (!emailValid) return;
    setLoading(true);
    await api.auth.forgotPassword({ email, lang });
    setLoading(false);
    onCodeSent(email);
  };

  return (
    <View>
      <Text style={styles.title}>{t.forgot.title}</Text>
      <Text style={styles.subtitle}>{t.forgot.subtitle}</Text>

      <Text style={styles.label}>{t.forgot.email}</Text>
      <TextInput style={[styles.input, touchedEmail && !emailValid && email.length > 0 && styles.inputError]}
        placeholder={t.forgot.emailPlaceholder} placeholderTextColor="#bbb" value={email}
        onChangeText={setEmail} onBlur={() => setTouchedEmail(true)}
        keyboardType="email-address" autoCapitalize="none" />
      {touchedEmail && !emailValid && email.length > 0 && <Text style={styles.errorText}>{t.forgot.emailError}</Text>}

      <TouchableOpacity style={[styles.submitBtn, { marginTop: 16 }]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitText}>{t.forgot.submit}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onSwitchLogin}>
        <Text style={styles.linkText}>← {t.forgot.backToLogin}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ====== FORGOT CODE + NEW PASSWORD STEP ====== */
function ForgotCodeSection({ email, onSuccess, onBack }: {
  email: string; onSuccess: () => void; onBack: () => void;
}) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const allChecks = Object.values(checks).every(Boolean);

  const handleSubmit = async () => {
    setError("");
    if (code.length !== 6 || !allChecks) return;
    setLoading(true);
    const res = await api.auth.resetPassword({ email, code, password });
    setLoading(false);
    if (res.error) { setError(t.forgot.codeError); return; }
    setSuccess(true);
    setTimeout(onSuccess, 2000);
  };

  return (
    <View>
      <Text style={styles.title}>{t.forgot.title}</Text>
      <Text style={styles.subtitle}>{t.forgot.codeSent}</Text>

      {success ? (
        <View style={styles.successBox}><Text style={styles.successText}>✓ {t.forgot.success}</Text></View>
      ) : (
        <>
          {error !== "" && <View style={styles.errorBox}><Text style={styles.errorBoxText}>{error}</Text></View>}

          <Text style={styles.label}>{t.forgot.code}</Text>
          <TextInput style={styles.codeInput} placeholder={t.forgot.codePlaceholder} placeholderTextColor="#ddd"
            value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            maxLength={6} keyboardType="number-pad" />

          <Text style={[styles.label, { marginTop: 14 }]}>{t.forgot.newPassword}</Text>
          <View>
            <TextInput style={[styles.input, { paddingRight: 44 }]} placeholder={t.forgot.newPasswordPlaceholder}
              placeholderTextColor="#bbb" value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
              <Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          {password.length > 0 && <PasswordChecks password={password} />}

          <TouchableOpacity style={[styles.submitBtn, { marginTop: 16 }]} onPress={handleSubmit}
            disabled={loading || code.length !== 6 || !allChecks}>
            {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitText}>{t.forgot.resetSubmit}</Text>}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={{ alignItems: "center", marginTop: 20 }} onPress={onBack}>
        <Text style={[styles.linkText, { color: colors.textGray }]}>← {t.forgot.backToLogin}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ====== STYLES ====== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGray },
  header: {
    backgroundColor: colors.navyDark, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.white },
  langSwitch: { flexDirection: "row", gap: 4 },
  langBtn: { padding: 4, borderRadius: 4, borderWidth: 2, borderColor: "transparent", opacity: 0.5 },
  langActive: { opacity: 1, borderColor: colors.accent },
  flag: { fontSize: 18 },
  content: { padding: 20, paddingBottom: 40 },

  // Profile logged in
  profileContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navyLight,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: colors.accent },
  profileName: { fontSize: 20, fontWeight: "700", color: colors.textDark },
  profileEmail: { fontSize: 14, color: colors.textGray, marginTop: 4 },
  profileMeta: { fontSize: 13, color: colors.accent, marginTop: 2 },
  logoutBtn: {
    marginTop: 28, borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 32,
  },
  logoutText: { fontSize: 14, fontWeight: "500", color: colors.textDark },

  // Forms
  title: { fontSize: 22, fontWeight: "700", color: colors.textDark },
  subtitle: { fontSize: 13, color: colors.textGray, marginBottom: 20, lineHeight: 20 },
  googleBtn: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  googleText: { fontSize: 14, fontWeight: "500", color: colors.textDark },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#eee" },
  dividerText: { fontSize: 12, color: colors.textGray },
  label: { fontSize: 13, fontWeight: "600", color: colors.textDark, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 11,
    fontSize: 14, color: colors.textDark, backgroundColor: colors.white,
  },
  inputError: { borderColor: "#E53935" },
  errorText: { fontSize: 11, color: "#E53935", marginTop: 4, fontWeight: "500" },
  errorBox: { backgroundColor: "#FFF0F0", borderWidth: 1, borderColor: "#FFCDD2", borderRadius: 8, padding: 10, marginBottom: 14 },
  errorBoxText: { fontSize: 13, color: "#E53935", fontWeight: "500", textAlign: "center" },
  successBox: { backgroundColor: "#E8F5E9", borderRadius: 10, padding: 16, marginBottom: 16 },
  successText: { fontSize: 14, color: "#2E7D32", textAlign: "center", fontWeight: "600" },
  codeInput: {
    borderWidth: 2, borderColor: "#ddd", borderRadius: 10, padding: 14,
    fontSize: 28, fontWeight: "700", textAlign: "center", letterSpacing: 10,
    color: colors.textDark, backgroundColor: colors.white, marginTop: 8,
  },
  eyeBtn: { position: "absolute", right: 10, top: 10, padding: 4 },
  optionsRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 14, marginBottom: 16,
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  optionText: { fontSize: 13, color: colors.textDark },
  linkText: { fontSize: 13, fontWeight: "500", color: colors.accent },
  submitBtn: {
    backgroundColor: colors.navyDark, borderRadius: 10, padding: 13, alignItems: "center",
  },
  submitText: { fontSize: 14, fontWeight: "600", color: colors.white },
  bottomRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  bottomText: { fontSize: 13, color: colors.textGray },
  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1, marginBottom: 12 },
  field: { marginBottom: 12 },
});
