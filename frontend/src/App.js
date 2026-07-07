import { useMemo, useState } from "react";
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

  return (
    <div className="app-shell">
      <div className="card">
        <header className="header">
          <p className="tagline">Strong passwords in one click.</p>
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
      </div>
    </div>
  );
}

export default App;
