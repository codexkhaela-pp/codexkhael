"use client";

import { useState } from "react";
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ajustes de Cuenta</h1>
        <p className={styles.subtitle}>Gestiona tu información personal, seguridad y suscripción.</p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>👤</span> Datos del Perfil</h2>
        <form onSubmit={handleSaveName}>
          <div className={styles.formGroup}>
            <label>Correo Electrónico</label>
            <input type="email" className={styles.input} value={email} disabled />
          </div>
          <div className={styles.formGroup}>
            <label>Nombre / Apodo</label>
            <input
              type="text"
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre en Codex Khael"
            />
          </div>
          <button type="submit" className={styles.button} disabled={isSavingName || displayName === initialDisplayName}>
            {isSavingName ? "Guardando..." : "Guardar Cambios"}
          </button>
          {nameMessage && (
            <div className={`${styles.message} ${nameMessage.type === "success" ? styles.messageSuccess : styles.messageError}`}>
              {nameMessage.text}
            </div>
          )}
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>🔒</span> Seguridad</h2>
        <form onSubmit={handleSavePassword}>
          <div className={styles.formGroup}>
            <label>Contraseña Actual</label>
            <input
              type="password"
              className={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Nueva Contraseña</label>
            <input
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className={styles.button} disabled={isSavingPassword || !currentPassword || !newPassword}>
            {isSavingPassword ? "Actualizando..." : "Cambiar Contraseña"}
          </button>
          {passMessage && (
            <div className={`${styles.message} ${passMessage.type === "success" ? styles.messageSuccess : styles.messageError}`}>
              {passMessage.text}
            </div>
          )}
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>⭐</span> Suscripción</h2>
        <p className={styles.subtitle}>Tu plan actual de aprendizaje en Codex Khael.</p>
        
        <div className={styles.planCard}>
          <div className={styles.planInfo}>
            <h4>Plan {planName}</h4>
            <p>Acceso a las lecciones y tiradas básicas.</p>
            <span className={styles.planStatus}>Activo</span>
          </div>
          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} disabled title="Disponible próximamente">
            Mejorar a Premium
          </button>
        </div>
      </section>
    </div>
  );
}
