"use client";

import { useState, type FormEvent } from "react";
import { Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { apiPost } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { GraduationCap } from "lucide-react";

/**
 * AuthSwitch
 * ----------
 * Animated sign-in / sign-up panel with a sliding circular transition.
 * The sign-in form is fully wired to the real /api/auth/login endpoint.
 * The sign-up form collects details and continues to the plan-selection
 * step on the register page (registration requires a subscription plan).
 *
 * All CSS is scoped under `.auth-switch` so it never leaks into the rest
 * of the application. The layout is intentionally LTR so the signature
 * animation works identically in every language; all visible copy is
 * still fully translated.
 */
export default function AuthSwitch() {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const refreshUser = useAppStore((s) => s.refreshUser);

  const [isSignUp, setIsSignUp] = useState(false);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Sign-up only
  const [username, setUsername] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fillDemoCredentials() {
    setEmail("admin@courselearn.dev");
    setPassword("admin123");
    setError(null);
    setIsSignUp(false);
  }

  async function onSignInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiPost<{ user: { role: string } }>("/api/auth/login", {
        email,
        password,
      });
      toast({ title: t("auth.welcomeBackToast"), description: t("auth.loggedInDesc") });
      await refreshUser();
      const role = result?.user?.role;
      if (role === "ADMIN") {
        navigate(["admin", "overview"]);
      } else if (role === "STUDENT") {
        navigate(["student", "overview"]);
      } else if (role === "UNIVERSITY") {
        navigate(["university", "overview"]);
      }
    } catch (e: any) {
      setError(e?.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  function onSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!username || !email || password.length < 6) {
      setError(t("auth.pleaseCompleteFields"));
      return;
    }
    // Registration on this platform requires selecting a subscription plan.
    // Carry the entered details forward to the register page via query so
    // the user doesn't have to re-type them.
    navigate(["register"], {
      name: username,
      email,
      // password intentionally NOT passed via URL
    });
  }

  return (
    <div className="auth-switch" dir="ltr">
      <style>{`
        .auth-switch,
        .auth-switch * {
          box-sizing: border-box;
        }

        .auth-switch {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
        }

        .auth-switch .topbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }

        .auth-switch .topbar-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-weight: 600;
          font-size: 1.05rem;
          cursor: pointer;
          background: none;
          border: none;
          transition: opacity 0.2s;
        }
        .auth-switch .topbar-brand:hover { opacity: 0.88; }
        .auth-switch .topbar-brand .mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          width: 32px;
          border-radius: 10px;
          background: rgba(255,255,255,0.18);
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        }

        .auth-switch .topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-switch .topbar-btn {
          color: #fff;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.28);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s, transform 0.2s;
        }
        .auth-switch .topbar-btn:hover {
          background: rgba(255,255,255,0.22);
          transform: translateY(-1px);
        }
        /* Make the language switcher trigger readable on the gradient */
        .auth-switch .topbar-actions button {
          color: #fff !important;
          background: rgba(255,255,255,0.12) !important;
          border: 1px solid rgba(255,255,255,0.28) !important;
          border-radius: 999px !important;
        }
        .auth-switch .topbar-actions button:hover {
          background: rgba(255,255,255,0.22) !important;
        }

        .auth-switch .container {
          position: relative;
          width: 100%;
          max-width: 900px;
          height: 550px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .auth-switch .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .auth-switch .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        .auth-switch form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 5rem;
          transition: all 0.2s 0.7s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        .auth-switch form.sign-up-form {
          opacity: 0;
          z-index: 1;
        }

        .auth-switch form.sign-in-form {
          z-index: 2;
        }

        .auth-switch .title {
          font-size: 2.2rem;
          color: #444;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .auth-switch .error-text {
          color: #e53935;
          font-size: 0.8rem;
          margin: 4px 0 0;
          min-height: 1.1rem;
          text-align: center;
          max-width: 380px;
          width: 100%;
        }

        .auth-switch .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f0f0f0;
          margin: 10px 0;
          height: 55px;
          border-radius: 55px;
          display: grid;
          grid-template-columns: 15% 85%;
          padding: 0 0.4rem;
          position: relative;
          transition: 0.3s;
        }

        .auth-switch .input-field:focus-within {
          background-color: #e8e8e8;
          box-shadow: 0 0 0 2px #667eea;
        }

        .auth-switch .input-field i {
          text-align: center;
          line-height: 55px;
          color: #666;
          transition: 0.5s;
          font-size: 1.1rem;
          font-style: normal;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-switch .input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 1rem;
          color: #333;
          width: 100%;
          padding: 0 0.4rem;
        }

        .auth-switch .input-field input::placeholder {
          color: #aaa;
          font-weight: 400;
        }

        .auth-switch .btn {
          width: 150px;
          background-color: #667eea;
          border: none;
          outline: none;
          height: 49px;
          border-radius: 49px;
          color: #fff;
          text-transform: uppercase;
          font-weight: 600;
          margin: 10px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .auth-switch .btn:hover {
          background-color: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .auth-switch .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .auth-switch .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .auth-switch .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .auth-switch .left-panel {
          pointer-events: all;
          padding: 3rem 17% 2rem 12%;
        }

        .auth-switch .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 17%;
        }

        .auth-switch .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
        }

        .auth-switch .panel h3 {
          font-weight: 600;
          line-height: 1;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .auth-switch .panel p {
          font-size: 0.95rem;
          padding: 0.7rem 0;
        }

        .auth-switch .btn.transparent {
          margin: 0;
          background: none;
          border: 2px solid #fff;
          width: 130px;
          height: 41px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .auth-switch .btn.transparent:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .auth-switch .right-panel .content {
          transform: translateX(800px);
        }

        .auth-switch .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .auth-switch .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .auth-switch .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .auth-switch .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .auth-switch .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .auth-switch .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .auth-switch .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .auth-switch .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .auth-switch .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #667eea 0%, #764ba2 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .auth-switch .social-text {
          padding: 0.7rem 0;
          font-size: 1rem;
          color: #666;
        }

        .auth-switch .social-media {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .auth-switch .social-icon {
          height: 46px;
          width: 46px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 50%;
          color: #667eea;
          font-size: 1.2rem;
          transition: 0.3s;
          cursor: pointer;
        }

        .auth-switch .social-icon:hover {
          border-color: #764ba2;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .auth-switch .social-icon svg {
          transition: 0.3s;
        }

        .auth-switch .demo-chip {
          margin-top: 14px;
          font-size: 0.75rem;
          color: #666;
          background: #f0f0f0;
          padding: 7px 16px;
          border-radius: 999px;
          cursor: pointer;
          border: 1px solid #e0e0e0;
          transition: 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .auth-switch .demo-chip:hover {
          background: #e8e8e8;
          border-color: #667eea;
          color: #667eea;
        }

        @media (max-width: 870px) {
          .auth-switch .container {
            min-height: 800px;
            height: 100vh;
          }
          .auth-switch .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .auth-switch .signin-signup,
          .auth-switch .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .auth-switch .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .auth-switch .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2.5rem 8%;
            grid-column: 1 / 2;
          }
          .auth-switch .right-panel {
            grid-row: 3 / 4;
          }
          .auth-switch .left-panel {
            grid-row: 1 / 2;
          }
          .auth-switch .panel .content {
            padding-right: 15%;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .auth-switch .panel h3 {
            font-size: 1.2rem;
          }
          .auth-switch .panel p {
            font-size: 0.7rem;
            padding: 0.5rem 0;
          }
          .auth-switch .btn.transparent {
            width: 110px;
            height: 35px;
            font-size: 0.7rem;
          }
          .auth-switch .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .auth-switch .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .auth-switch .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .auth-switch .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .auth-switch .right-panel .content {
            transform: translateY(300px);
          }
          .auth-switch .container.sign-up-mode .signin-signup {
            top: 5%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          .auth-switch form {
            padding: 0 1.5rem;
          }
          .auth-switch .panel .content {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>

      {/* Floating top bar — overlays the gradient, never disrupts the card */}
      <div className="topbar">
        <button
          type="button"
          className="topbar-brand"
          onClick={() => navigate([""])}
          aria-label="CourseLearn home"
        >
          <span className="mark">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>
            Course<span style={{ color: "rgba(255,255,255,0.7)" }}>Learn</span>
          </span>
        </button>
        <div className="topbar-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="topbar-btn"
            onClick={() => navigate([""])}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.backToHome")}
          </button>
        </div>
      </div>

      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        <div className="forms-container">
          <div className="signin-signup">
            {/* ── Sign in ── */}
            <form className="sign-in-form" onSubmit={onSignInSubmit}>
              <h2 className="title">{t("auth.signIn")}</h2>
              <div className="input-field">
                <i>
                  <Mail className="h-5 w-5" />
                </i>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("common.email")}
                  autoComplete="email"
                />
              </div>
              <div className="input-field">
                <i>
                  <Lock className="h-5 w-5" />
                </i>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("common.password")}
                  autoComplete="current-password"
                />
              </div>
              {error && !isSignUp && <p className="error-text">{error}</p>}
              <button type="submit" className="btn solid" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("auth.signingIn")}
                  </>
                ) : (
                  t("auth.signIn")
                )}
              </button>
              <p className="social-text">{t("auth.orSignInSocial")}</p>
              <div className="social-media">
                <SocialIcons />
              </div>
              <button
                type="button"
                className="demo-chip"
                onClick={fillDemoCredentials}
              >
                {t("auth.demoCredsChip")}
              </button>
            </form>

            {/* ── Sign up ── */}
            <form className="sign-up-form" onSubmit={onSignUpSubmit}>
              <h2 className="title">{t("auth.signUp")}</h2>
              <div className="input-field">
                <i>
                  <User className="h-5 w-5" />
                </i>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("auth.username")}
                  autoComplete="name"
                />
              </div>
              <div className="input-field">
                <i>
                  <Mail className="h-5 w-5" />
                </i>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("common.email")}
                  autoComplete="email"
                />
              </div>
              <div className="input-field">
                <i>
                  <Lock className="h-5 w-5" />
                </i>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("common.password")}
                  autoComplete="new-password"
                />
              </div>
              {error && isSignUp && <p className="error-text">{error}</p>}
              <button type="submit" className="btn" disabled={loading}>
                {t("auth.signUp")}
              </button>
              <p className="social-text">{t("auth.orSignUpSocial")}</p>
              <div className="social-media">
                <SocialIcons />
              </div>
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>{t("auth.newHere")}</h3>
              <p>{t("auth.newHereDesc")}</p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => {
                  setError(null);
                  setIsSignUp(true);
                }}
              >
                {t("auth.signUp")}
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>{t("auth.oneOfUs")}</h3>
              <p>{t("auth.oneOfUsDesc")}</p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => {
                  setError(null);
                  setIsSignUp(false);
                }}
              >
                {t("auth.signIn")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialIcons() {
  return (
    <>
      <a href="#" className="social-icon" aria-label="Google">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </a>
      <a href="#" className="social-icon" aria-label="Facebook">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#1877F2"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <a href="#" className="social-icon" aria-label="Twitter / X">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#1DA1F2"
        >
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      </a>
      <a href="#" className="social-icon" aria-label="LinkedIn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#0A66C2"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
    </>
  );
}
