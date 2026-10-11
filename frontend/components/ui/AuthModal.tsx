"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export type AuthModalTab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  initialTab?: AuthModalTab;
  prefillEmail?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  initialTab = "login",
  prefillEmail,
}: AuthModalProps) {
  const {
    login,
    requestRegistrationCode,
    confirmRegistrationCode,
    requestPasswordResetCode,
    confirmPasswordResetCode,
  } = useAuth();

  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [view, setView] = useState<
    "login" | "register" | "register_code" | "forgot" | "forgot_code"
  >(initialTab);
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    setView(initialTab);
    setError(null);
    setStatus(null);
    setIsSubmitting(false);
    setPassword("");
    setNewPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
    setFirstName("");
    setLastName("");
    setCode("");
    setChallengeId(null);
    if (prefillEmail) setEmail(prefillEmail);
  }, [isOpen, initialTab, prefillEmail]);

  if (!isOpen) return null;

  const title =
    view === "login"
      ? "Connexion"
      : view === "register"
        ? "Créer un compte"
        : view === "register_code"
          ? "Valider votre email"
          : view === "forgot"
            ? "Mot de passe oublié"
            : "Nouveau mot de passe";

  const subtitle =
    view === "login"
      ? "Accédez à votre compte"
      : view === "register"
        ? "Rejoignez 2dayna2day"
        : view === "register_code"
          ? "Entrez le code à 6 chiffres reçu par email"
          : view === "forgot"
            ? "Recevez un code par email"
            : "Confirmez le code et choisissez un nouveau mot de passe";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      const challenge = await requestRegistrationCode({
        firstName,
        lastName,
        email,
        password,
      });
      if (challenge.debugCode) {
        setStatus(`Code de test : ${challenge.debugCode}`);
      }
      setChallengeId(challenge.challengeId);
      setCode("");
      setView("register_code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de création de compte",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      await confirmRegistrationCode({ challengeId, code });
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      const challenge = await requestPasswordResetCode(email);
      if (challenge.debugCode) {
        setStatus(`Code de test : ${challenge.debugCode}`);
      }
      setChallengeId(challenge.challengeId);
      setCode("");
      setNewPassword("");
      setView("forgot_code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      await confirmPasswordResetCode({
        challengeId,
        code,
        newPassword,
      });
      setStatus("Mot de passe mis à jour. Vous pouvez vous connecter.");
      setPassword("");
      setNewPassword("");
      setCode("");
      setChallengeId(null);
      setView("login");
      setTab("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeTab = (nextTab: AuthModalTab) => {
    setTab(nextTab);
    setView(nextTab);
    setError(null);
    setStatus(null);
    setPassword("");
    setNewPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
    setCode("");
    setChallengeId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-body">{title}</h2>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(view === "login" || view === "register") && (
          <div className="p-5 pb-0">
            <div className="grid grid-cols-2 bg-neutral-light rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleChangeTab("login")}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === "login"
                    ? "bg-white shadow-sm text-body"
                    : "text-gray-600 hover:text-body"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => handleChangeTab("register")}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === "register"
                    ? "bg-white shadow-sm text-body"
                    : "text-gray-600 hover:text-body"
                }`}
              >
                Inscription
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={
            view === "login"
              ? handleLoginSubmit
              : view === "register"
                ? handleRegisterRequest
                : view === "register_code"
                  ? handleRegisterVerify
                  : view === "forgot"
                    ? handleForgotRequest
                    : handleForgotConfirm
          }
          className="p-5 space-y-4"
        >
          {status && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              {status}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {view === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Dupont"
                />
              </div>
            </div>
          )}

          {(view === "register_code" || view === "forgot_code") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code (6 chiffres)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
                }
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tracking-[0.35em] text-center text-lg"
                placeholder="123456"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={view === "register_code" || view === "forgot_code"}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="vous@exemple.com"
            />
          </div>

          {(view === "login" || view === "register") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-body"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {view === "login" && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot");
                      setTab("login");
                      setError(null);
                      setStatus(null);
                      setPassword("");
                      setNewPassword("");
                      setCode("");
                      setChallengeId(null);
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
            </div>
          )}

          {view === "forgot_code" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-body"
                  aria-label={
                    showNewPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting
              ? "Veuillez patienter..."
              : view === "login"
                ? "Se connecter"
                : view === "register"
                  ? "Recevoir le code"
                  : view === "register_code"
                    ? "Valider et créer le compte"
                    : view === "forgot"
                      ? "Recevoir le code"
                      : "Mettre à jour le mot de passe"}
          </button>

          {(view === "register_code" || view === "forgot_code") && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStatus(null);
                  setCode("");
                  setChallengeId(null);
                  setView(view === "register_code" ? "register" : "forgot");
                }}
                className="text-sm font-medium text-gray-600 hover:text-body"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setStatus(null);
                  setIsSubmitting(true);
                  try {
                    if (view === "register_code") {
                      const challenge = await requestRegistrationCode({
                        firstName,
                        lastName,
                        email,
                        password,
                      });
                      if (challenge.debugCode) {
                        setStatus(`Code de test : ${challenge.debugCode}`);
                      }
                      setChallengeId(challenge.challengeId);
                      setCode("");
                    } else {
                      const challenge = await requestPasswordResetCode(email);
                      if (challenge.debugCode) {
                        setStatus(`Code de test : ${challenge.debugCode}`);
                      }
                      setChallengeId(challenge.challengeId);
                      setCode("");
                    }
                    setStatus((prev) => prev || "Code renvoyé.");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Erreur");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
                disabled={isSubmitting}
              >
                Renvoyer le code
              </button>
            </div>
          )}

          {view === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setView("login");
                setTab("login");
                setError(null);
                setStatus(null);
                setCode("");
                setChallengeId(null);
                setNewPassword("");
              }}
              className="text-sm font-medium text-gray-600 hover:text-body"
            >
              Revenir à la connexion
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
