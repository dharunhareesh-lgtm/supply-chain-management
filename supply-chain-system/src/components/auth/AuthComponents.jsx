/* ============================================================
   AgriChain — Reusable Auth Components
   All authentication pages import from this single file.
   Pure UI components — no business logic inside.
   ============================================================ */
import { Link } from "react-router-dom";
import { Leaf, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import "./auth.css";

/* ── Layout ── */
export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout-grid" />
      {children}
    </div>
  );
}

/* ── Card ── */
export function AuthCard({ children, wide }) {
  return (
    <div className={`auth-card${wide ? " auth-card--wide" : ""}`}>
      {children}
    </div>
  );
}

/* ── Logo ── */
export function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-logo-icon">
        <Leaf />
      </div>
      <span className="auth-logo-text">AgriChain</span>
    </div>
  );
}

/* ── Top Bar (Logo + Back link) ── */
export function AuthTopBar({ backTo, backLabel = "Back to Login" }) {
  return (
    <div className="auth-topbar">
      <AuthLogo />
      {backTo && (
        <Link to={backTo} className="auth-back-link">
          <ArrowLeft /> {backLabel}
        </Link>
      )}
    </div>
  );
}

/* ── Header ── */
export function AuthHeader({ title, subtitle, center }) {
  return (
    <div className={`auth-header${center ? " auth-header--center" : ""}`}>
      <h1 className="auth-title">{title}</h1>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
    </div>
  );
}

/* ── Progress Steps ── */
export function AuthProgress({ steps, currentStep }) {
  return (
    <div className="auth-progress">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={i} className="auth-progress-step">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                className={`auth-progress-dot ${
                  isCompleted ? "auth-progress-dot--completed" :
                  isActive ? "auth-progress-dot--active" :
                  "auth-progress-dot--pending"
                }`}
              >
                {isCompleted ? <CheckCircle style={{ width: 16, height: 16 }} /> : stepNum}
              </div>
              <span className={`auth-progress-label${isActive ? " auth-progress-label--active" : ""}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`auth-progress-line${isCompleted ? " auth-progress-line--completed" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Input ── */
export function AuthInput({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  maxLength,
  disabled,
  id,
  inputRef,
  btnLabel,
  onBtnClick,
  btnDisabled,
  className: extraClass,
  style: extraStyle
}) {
  const hasBtn = !!btnLabel;
  return (
    <div className="auth-input-group">
      {label && (
        <label className="auth-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="auth-input-wrapper">
        {Icon && <Icon className="auth-input-icon" />}
        <input
          id={id}
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          maxLength={maxLength}
          disabled={disabled}
          className={`auth-input${!Icon ? " auth-input--no-icon" : ""}${hasBtn ? " auth-input--with-btn" : ""}${extraClass ? ` ${extraClass}` : ""}`}
          style={extraStyle}
        />
        {hasBtn && (
          <button
            type="button"
            onClick={onBtnClick}
            disabled={btnDisabled}
            className="auth-input-btn"
          >
            {btnLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Password Input ── */
export function AuthPasswordInput({
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  required,
  showPassword,
  onTogglePassword,
  id
}) {
  return (
    <div className="auth-input-group">
      {label && (
        <label className="auth-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="auth-input-wrapper">
        {Icon && <Icon className="auth-input-icon" />}
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`auth-input${!Icon ? " auth-input--no-icon" : ""}`}
          style={{ paddingRight: "48px" }}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="auth-password-toggle"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </div>
  );
}

/* ── Primary Button ── */
export function AuthPrimaryButton({ children, loading, disabled, onClick, type = "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="auth-btn-primary"
    >
      {loading ? <div className="auth-spinner" /> : children}
    </button>
  );
}

/* ── Secondary Button ── */
export function AuthSecondaryButton({ children, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className="auth-btn-secondary">
      {children}
    </button>
  );
}

/* ── Error ── */
export function AuthError({ message, children }) {
  const errMsg = message || children;
  if (!errMsg) return null;
  return (
    <div className="auth-error" role="alert">
      <AlertCircle />
      <span>{errMsg}</span>
    </div>
  );
}

/* ── Success Message ── */
export function AuthSuccessMsg({ message }) {
  if (!message) return null;
  return (
    <div className="auth-success-msg">
      <CheckCircle />
      <span>{message}</span>
    </div>
  );
}

/* ── Footer ── */
export function AuthFooter({ text, linkText, linkTo }) {
  return (
    <div className="auth-footer">
      {text}{" "}
      <Link to={linkTo} className="auth-footer-link">
        {linkText}
      </Link>
    </div>
  );
}

/* ── Divider ── */
export function AuthDivider({ text = "or" }) {
  return (
    <div className="auth-divider">
      <div className="auth-divider-line" />
      <span className="auth-divider-text">{text}</span>
      <div className="auth-divider-line" />
    </div>
  );
}

/* ── OTP Sent Notice ── */
export function AuthOtpNotice({ visible }) {
  if (!visible) return null;
  return (
    <div className="auth-otp-notice">
      <CheckCircle /> OTP sent to your email. Check inbox/spam.
    </div>
  );
}

/* ── Password Strength ── */
export function AuthPasswordStrength({ validations }) {
  const rules = [
    { key: "length", label: "At least 8 characters" },
    { key: "upper", label: "One uppercase letter" },
    { key: "lower", label: "One lowercase letter" },
    { key: "digit", label: "One number" },
    { key: "special", label: "One special character" }
  ];
  return (
    <div className="auth-pw-strength">
      <div className="auth-pw-strength-title">Requirements:</div>
      <div className="auth-pw-strength-grid">
        {rules.map((r) => {
          const pass = validations[r.key];
          return (
            <div key={r.key} className={`auth-pw-rule ${pass ? "auth-pw-rule--pass" : "auth-pw-rule--fail"}`}>
              <div className={`auth-pw-dot ${pass ? "auth-pw-dot--pass" : "auth-pw-dot--fail"}`} />
              {r.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Success State (full card takeover) ── */
export function AuthSuccessState({ title, text, countdown, buttonLabel, onButtonClick }) {
  return (
    <div className="auth-success-state">
      <div className="auth-success-icon-wrap">
        <CheckCircle />
      </div>
      <h3 className="auth-success-title">{title}</h3>
      {text && <p className="auth-success-text">{text}</p>}
      {countdown !== undefined && (
        <p className="auth-success-countdown">
          Redirecting in <span>{countdown}</span> seconds...
        </p>
      )}
      {buttonLabel && (
        <button
          onClick={onButtonClick}
          className="auth-btn-primary"
          style={{ marginTop: 20 }}
        >
          {buttonLabel} <ArrowRight />
        </button>
      )}
    </div>
  );
}
