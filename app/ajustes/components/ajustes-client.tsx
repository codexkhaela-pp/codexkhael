"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../ajustes.module.css";

type AjustesClientProps = {
  initialDisplayName: string;
  email: string;
  planName: string;
};

export function AjustesClient({ initialDisplayName, email, planName }: AjustesClientProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passMessage, setPassMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (displayName.trim() === "") {
      setNameMessage({ text: "El nombre no puede estar vacío.", type: "error" });
      return;
    }

    setIsSavingName(true);
    setNameMessage(null);

    try {
      const res = await fetch("/api/ajustes/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      const data = await res.json();
      if (res.ok) {
        setNameMessage({ text: "Nombre actualizado exitosamente.", type: "success" });
      } else {
        setNameMessage({ text: data.error || "Ocurrió un error.", type: "error" });
      }
    } catch (error) {
      setNameMessage({ text: "Error de conexión.", type: "error" });
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMessage({ text: "Las contraseñas nuevas no coinciden.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPassMessage({ text: "La nueva contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }

    setIsSavingPassword(true);
    setPassMessage(null);

    try {
      const res = await fetch("/api/ajustes/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPassMessage({ text: "Contraseña actualizada exitosamente.", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassMessage({ text: data.error || "Ocurrió un error.", type: "error" });
      }
    } catch (error) {
      setPassMessage({ text: "Error de conexión.", type: "error" });
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className={styles.settingsPageWrapper}>
      <div className={styles.settingsMain}>
        <header className={styles.settingsHeader}>
          <div className={styles.settingsTitleRow}>
            <div className={styles.settingsTitleIcon} aria-hidden="true">✧</div>
            <h1 className={styles.settingsTitle}>Ajustes de Cuenta</h1>
          </div>
          <p className={styles.settingsSubtitle}>Gestiona tu información personal, seguridad y suscripción.</p>
        </header>

        {/* PANEL PERFIL */}
        <section className={styles.settingsPanel}>
          <div className={styles.settingsPanelLeft}>
            <div className={styles.settingsPanelIconBox} aria-hidden="true">👤</div>
            <div>
              <h2 className={styles.settingsPanelTitle}>Datos del Perfil</h2>
              <p className={styles.settingsPanelDesc}>Esta información se mostrará en tu perfil público.</p>
            </div>
          </div>
          
          <div className={styles.settingsPanelRight}>
            <form onSubmit={handleSaveName} className={styles.settingsFormFields}>
              <div className={styles.settingsFormRow}>
                <div className={styles.settingsField} style={{ gridColumn: "span 2" }}>
                  <label className={styles.settingsLabel}>Correo electrónico</label>
                  <div className={styles.settingsInputWrapper}>
                    <span className={styles.settingsInputIcon} aria-hidden="true">✉</span>
                    <input type="email" className={`${styles.settingsInput} ${styles.settingsInputWithIcon}`} value={email} disabled />
                  </div>
                </div>
              </div>
              
              <div className={styles.settingsFormRow}>
                <div className={styles.settingsField} style={{ gridColumn: "span 2" }}>
                  <label className={styles.settingsLabel}>Nombre / Apodo</label>
                  <div className={styles.settingsInputWrapper}>
                    <span className={styles.settingsInputIcon} aria-hidden="true">👤</span>
                    <input
                      type="text"
                      className={`${styles.settingsInput} ${styles.settingsInputWithIcon}`}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Tu nombre en Codex Khael"
                    />
                  </div>
                  {nameMessage && (
                    <span className={`${styles.settingsMessage} ${nameMessage.type === "success" ? styles.settingsMessageSuccess : styles.settingsMessageError}`}>
                      {nameMessage.text}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.settingsFormActions}>
                <button type="submit" className={styles.settingsBtnPrimary} disabled={isSavingName || displayName === initialDisplayName}>
                  {isSavingName ? "Guardando..." : "Guardar Cambios"} <span aria-hidden="true">✧</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* PANEL SEGURIDAD */}
        <section className={styles.settingsPanel}>
          <div className={styles.settingsPanelLeft}>
            <div className={styles.settingsPanelIconBox} aria-hidden="true">🔒</div>
            <div>
              <h2 className={styles.settingsPanelTitle}>Seguridad</h2>
              <p className={styles.settingsPanelDesc}>Mantén tu cuenta segura actualizando tu contraseña periódicamente.</p>
            </div>
          </div>
          
          <div className={styles.settingsPanelRight}>
            <form onSubmit={handleSavePassword} className={styles.settingsFormFields}>
              <div className={styles.settingsFormRow}>
                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Contraseña actual</label>
                  <div className={styles.settingsInputWrapper}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className={styles.settingsInput}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className={styles.settingsInputToggle} onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                      {showCurrentPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>
                
                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Nueva contraseña</label>
                  <div className={styles.settingsInputWrapper}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className={styles.settingsInput}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className={styles.settingsInputToggle} onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>
                
                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Confirmar nueva contraseña</label>
                  <div className={styles.settingsInputWrapper}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.settingsInput}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className={styles.settingsInputToggle} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>
              </div>
              {passMessage && (
                <span className={`${styles.settingsMessage} ${passMessage.type === "success" ? styles.settingsMessageSuccess : styles.settingsMessageError}`}>
                  {passMessage.text}
                </span>
              )}
              
              <div className={styles.settingsFormActions}>
                <button type="submit" className={styles.settingsBtnPrimary} disabled={isSavingPassword || !currentPassword || !newPassword}>
                  {isSavingPassword ? "Actualizando..." : "Cambiar Contraseña"} <span aria-hidden="true">🔒</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* PANEL SUSCRIPCION */}
        <section className={styles.settingsPanel}>
          <div className={styles.settingsPanelLeft}>
            <div className={styles.settingsPanelIconBox} aria-hidden="true">★</div>
            <div>
              <h2 className={styles.settingsPanelTitle}>Suscripción</h2>
              <p className={styles.settingsPanelDesc}>Tu plan actual de aprendizaje en Codex Khael.</p>
            </div>
          </div>
          
          <div className={styles.settingsPanelRight} style={{ justifyContent: "center" }}>
            <div className={styles.settingsSubscriptionCard}>
              <div className={styles.settingsSubscriptionInfo}>
                <div className={styles.settingsPanelIconBox} style={{ border: "none" }} aria-hidden="true">🌿</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h3 className={styles.settingsSubscriptionName}>Plan {planName}</h3>
                    <span className={styles.settingsSubscriptionBadge}>ACTIVO</span>
                  </div>
                  <p className={styles.settingsSubscriptionDesc}>Acceso a las lecciones y tiradas básicas.</p>
                </div>
              </div>
              
              <button type="button" className={styles.settingsBtnGhost} disabled title="Disponible próximamente">
                <span aria-hidden="true">👑</span> Mejorar a Premium
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER PRIVACIDAD */}
        <footer className={styles.settingsFooterPanel}>
          <div className={styles.settingsFooterLeft}>
            <div className={styles.settingsFooterIcon} aria-hidden="true">🛡</div>
            <div>
              <p className={styles.settingsFooterText}>Tu privacidad y seguridad son nuestra prioridad.</p>
              <p className={styles.settingsFooterSubtext}>Codex Khael nunca compartirá tu información personal.</p>
            </div>
          </div>
          
          <div className={styles.settingsFooterRight}>
            <p>¿Necesitas ayuda?</p>
            <Link href="/ayuda">Visita nuestro <span>Centro de ayuda →</span></Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
