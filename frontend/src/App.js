import { useEffect, useMemo, useState } from "react";
import "./App.css";

const CHAR_SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?/~"
};

const MIN_LENGTH = 8;
const MAX_LENGTH = 32;

const STRENGTH_BUCKETS = [
  { label: "Very weak", min: 0, color: "#f94144" },
  { label: "Weak", min: 30, color: "#ffb703" },
  { label: "Moderate", min: 50, color: "#f4d35e" },
  { label: "Strong", min: 70, color: "#4cc9f0" },
  { label: "Very strong", min: 90, color: "#4c9b4c" }
];

const TOGGLE_OPTIONS = [
  { key: "upper", label: "Uppercase", hint: "A-Z" },
  { key: "lower", label: "Lowercase", hint: "a-z" },
  { key: "numbers", label: "Numbers", hint: "0-9" },
  { key: "symbols", label: "Symbols", hint: "!@#$%" }
];

const LOCAL_STORAGE_KEY = "password-generator-auth";

const shuffleString = (value) => {
  const characters = value.split("");
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters.join("");
};

const fallbackCopy = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const getStrengthInfo = (length, variety, hasPassword) => {
  const base = Math.min(100, length * 2 + variety * 12);
  const score = Math.min(100, hasPassword ? base + 5 : base);
  const bucket =
    [...STRENGTH_BUCKETS].reverse().find((level) => score >= level.min) ??
    STRENGTH_BUCKETS[0];
  return { score, label: bucket.label, color: bucket.color };
};

function App() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    upper: true,
    lower: true,
    numbers: true,
    symbols: true
  });
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const [authMode, setAuthMode] = useState("signup");
  const [signupData, setSignupData] = useState({ email: "", password: "", confirm: "" });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [storedCredentials, setStoredCredentials] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setStoredCredentials(JSON.parse(saved));
      }
    } catch (error) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      // eslint-disable-next-line no-console
      console.warn("Unable to read stored credentials", error);
    }
  }, []);

  useEffect(() => {
    if (!storedCredentials?.email) return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedCredentials));
  }, [storedCredentials]);

  useEffect(() => {
    if (storedCredentials?.email) {
      setLoginData((prev) => ({ ...prev, email: storedCredentials.email }));
    }
  }, [storedCredentials]);

  const enabledTypes = useMemo(
    () =>
      Object.entries(options)
        .filter(([, value]) => value)
        .map(([key]) => key),
    [options]
  );

  const strengthInfo = useMemo(
    () => getStrengthInfo(length, enabledTypes.length, password.length > 0),
    [length, enabledTypes.length, password.length]
  );

  const handleToggle = (type) => {
    setOptions((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleGenerate = () => {
    if (enabledTypes.length === 0) {
      setFeedback("Select at least one character type.");
      return;
    }

    const mandatoryCharacters = enabledTypes.map(
      (type) => CHAR_SETS[type][Math.floor(Math.random() * CHAR_SETS[type].length)]
    );

    const availableCharacters = enabledTypes.map((type) => CHAR_SETS[type]).join("");
    if (!availableCharacters) {
      setFeedback("Select at least one character type.");
      return;
    }

    let generatedPassword = mandatoryCharacters.join("");
    while (generatedPassword.length < length) {
      generatedPassword +=
        availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    }

    generatedPassword = shuffleString(generatedPassword);

    setPassword(generatedPassword);
    setFeedback("");
    setCopyStatus("");
  };

  const handleCopy = async () => {
    if (!password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
    } catch {
      fallbackCopy(password);
    }

    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus(""), 1800);
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthMessage({ type: "", text: "" });
  };

  const handleSignup = (event) => {
    event.preventDefault();
    const trimmedEmail = signupData.email.trim().toLowerCase();

    if (!trimmedEmail || !signupData.password || !signupData.confirm) {
      setAuthMessage({ type: "error", text: "Please fill every signup field." });
      return;
    }

    if (signupData.password.length < MIN_LENGTH) {
      setAuthMessage({ type: "error", text: `Password must be at least ${MIN_LENGTH} characters.` });
      return;
    }

    if (signupData.password !== signupData.confirm) {
      setAuthMessage({ type: "error", text: "Passwords must match." });
      return;
    }

    const credentials = { email: trimmedEmail, password: signupData.password };
    setStoredCredentials(credentials);
    setSignupData({ email: "", password: "", confirm: "" });
    setLoginData((prev) => ({ ...prev, email: trimmedEmail, password: "" }));
    setAuthMessage({ type: "success", text: "Account created. You can now log in." });
    setIsAuthenticated(true);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const trimmedEmail = loginData.email.trim().toLowerCase();

    if (!trimmedEmail || !loginData.password) {
      setAuthMessage({ type: "error", text: "Email and password are required." });
      return;
    }

    if (!storedCredentials) {
      setAuthMessage({ type: "error", text: "No account found. Sign up to continue." });
      return;
    }

    if (
      trimmedEmail !== storedCredentials.email ||
      loginData.password !== storedCredentials.password
    ) {
      setAuthMessage({ type: "error", text: "Email or password do not match our records." });
      return;
    }

    setAuthMessage({ type: "success", text: "Login successful. Welcome back!" });
    setIsAuthenticated(true);
    setLoginData((prev) => ({ ...prev, password: "" }));
  };

  const handleUseGeneratedPassword = () => {
    if (!password) {
      return;
    }

    setSignupData((prev) => ({ ...prev, password, confirm: password }));
    setAuthMessage({ type: "info", text: "Generated password copied into the signup form." });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthMessage({ type: "info", text: "Signed out successfully." });
  };

  const handleClearCredentials = () => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStoredCredentials(null);
    setIsAuthenticated(false);
    setAuthMessage({ type: "info", text: "Stored credentials removed." });
  };

  return (
    <div className="app-shell">
      <div className="app-grid">
        <section className="card generator-card">
          <header className="header">
            <p className="tagline">Strong passwords in one click</p>
            <h1>Password Generator</h1>
            <p className="description">
              Combine length, character variety, and instant feedback to craft secure, memorable
              credentials.
            </p>
          </header>

          <section className="password-display">
            <input
              type="text"
              readOnly
              value={password}
              placeholder="Your password will appear here"
              aria-label="Generated password"
            />
            <button
              type="button"
              className="copy-button"
              onClick={handleCopy}
              disabled={!password}
              aria-disabled={!password}
            >
              {copyStatus || "Copy"}
            </button>
          </section>

          {feedback && <p className="feedback-text">{feedback}</p>}

          <div className="strength-indicator">
            <div className="meter">
              <span
                style={{
                  width: `${strengthInfo.score}%`,
                  background: strengthInfo.color
                }}
              />
            </div>
            <div className="strength-text">{strengthInfo.label}</div>
          </div>

          <section className="controls">
            <label htmlFor="length" className="length-control">
              <span>
                Length <strong>{length}</strong>
              </span>
              <input
                type="range"
                id="length"
                name="length"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
              />
              <div className="length-hints">
                <span>Min {MIN_LENGTH}</span>
                <span>Max {MAX_LENGTH}</span>
              </div>
            </label>

            <div className="toggles">
              {TOGGLE_OPTIONS.map((toggle) => (
                <label
                  key={toggle.key}
                  className={`toggle ${options[toggle.key] ? "active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={options[toggle.key]}
                    onChange={() => handleToggle(toggle.key)}
                  />
                  <div>
                    <span>{toggle.label}</span>
                    <small>{toggle.hint}</small>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="actions">
            <button type="button" className="primary" onClick={handleGenerate}>
              Generate password
            </button>
          </div>
        </section>

        <section className="card auth-card">
          <div className="auth-header">
            <p className="tagline">Access control</p>
            <h2>{authMode === "signup" ? "Create an account" : "Log in securely"}</h2>
            <p className="description">
              Protect your generator with a lightweight signup and login experience that keeps your
              credentials handy while you craft passwords.
            </p>
          </div>

          <div className="mode-tabs">
            <button
              type="button"
              className={`mode-tab ${authMode === "signup" ? "active" : ""}`}
              onClick={() => switchAuthMode("signup")}
              aria-pressed={authMode === "signup"}
            >
              Sign up mode
            </button>
            <button
              type="button"
              className={`mode-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => switchAuthMode("login")}
              aria-pressed={authMode === "login"}
            >
              Log in mode
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={authMode === "signup" ? handleSignup : handleLogin}
            noValidate
          >
            {authMode === "signup" ? (
              <>
                <label className="input-group" htmlFor="signup-email">
                  <span>Email address</span>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(event) =>
                      setSignupData((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="you@email.com"
                    required
                  />
                </label>

                <label className="input-group" htmlFor="signup-password">
                  <span>Password</span>
                  <input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(event) =>
                      setSignupData((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Enter a strong password"
                    required
                  />
                </label>

                <label className="input-group" htmlFor="signup-confirm">
                  <span>Confirm password</span>
                  <input
                    id="signup-confirm"
                    type="password"
                    value={signupData.confirm}
                    onChange={(event) =>
                      setSignupData((prev) => ({ ...prev, confirm: event.target.value }))
                    }
                    placeholder="Repeat the password"
                    required
                  />
                </label>

                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleUseGeneratedPassword}
                    disabled={!password}
                  >
                    Use generated password
                  </button>
                  <button type="submit" className="primary">
                    Create account
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="input-group" htmlFor="login-email">
                  <span>Email address</span>
                  <input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(event) =>
                      setLoginData((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="you@email.com"
                    required
                  />
                </label>

                <label className="input-group" htmlFor="login-password">
                  <span>Password</span>
                  <input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(event) =>
                      setLoginData((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Enter your password"
                    required
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" className="primary">
                    Log in
                  </button>
                </div>
              </>
            )}
          </form>

          {authMessage.text && (
            <p className={`auth-feedback ${authMessage.type}`} role="status">
              {authMessage.text}
            </p>
          )}

          <div className="auth-meta">
            {storedCredentials?.email ? (
              <>
                <p className="muted-text">
                  Saved account: <strong>{storedCredentials.email}</strong>
                </p>
                <div className="meta-actions">
                  <button
                    type="button"
                    className="text-button"
                    onClick={handleLogout}
                    disabled={!isAuthenticated}
                  >
                    Sign out
                  </button>
                  <button type="button" className="text-button" onClick={handleClearCredentials}>
                    Remove saved data
                  </button>
                </div>
                {isAuthenticated && <p className="muted-text">Session active.</p>}
              </>
            ) : (
              <p className="muted-text">No credentials stored yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
