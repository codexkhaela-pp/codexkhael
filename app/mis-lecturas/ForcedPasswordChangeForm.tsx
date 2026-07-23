"use client";

import { useState } from "react";
import { ShieldAlert, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

export function ForcedPasswordChangeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/ajustes/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al actualizar la contraseña");
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      padding: "20px",
      fontFamily: "var(--font-sans), sans-serif",
      color: "#cfc8bb"
    }}>
      <div style={{
        background: "rgba(13, 15, 22, 0.95)",
        border: "1px solid rgba(201, 166, 107, 0.25)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "460px",
        padding: "40px",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative corner borders */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "20px",
          height: "20px",
          borderTop: "2px solid #c9a66b",
          borderLeft: "2px solid #c9a66b"
        }} />
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "20px",
          height: "20px",
          borderTop: "2px solid #c9a66b",
          borderRight: "2px solid #c9a66b"
        }} />
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{
            background: "rgba(201, 166, 107, 0.1)",
            border: "1px solid rgba(201, 166, 107, 0.3)",
            borderRadius: "50%",
            padding: "16px",
            color: "#c9a66b",
            display: "inline-flex"
          }}>
            <ShieldAlert size={36} />
          </div>
        </div>

        <h2 style={{
          fontFamily: "var(--font-serif), serif",
          fontSize: "1.8rem",
          color: "#f3ebdd",
          textAlign: "center",
          marginBottom: "12px",
          fontWeight: 400
        }}>
          Acceso de Seguridad
        </h2>
        
        <p style={{ 
          color: "#a19ba8", 
          fontSize: "0.95rem", 
          textAlign: "center", 
          lineHeight: "1.6",
          marginBottom: "32px" 
        }}>
          Por tu privacidad, debes personalizar la contraseña temporal proporcionada por Khael Tarotista antes de acceder a tus lecturas.
        </p>

        {success ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            background: "rgba(78, 189, 137, 0.1)",
            border: "1px solid rgba(78, 189, 137, 0.3)",
            color: "#4ebd89",
            padding: "24px",
            borderRadius: "12px",
            textAlign: "center",
            fontSize: "1rem",
            animation: "fadeIn 0.3s ease"
          }}>
            <CheckCircle2 size={36} />
            <span>¡Contraseña actualizada con éxito! Redirigiendo a tu portal...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "#a3957f", textTransform: "uppercase", letterSpacing: "1px" }}>Contraseña Temporal Actual</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña temporal"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(197, 168, 128, 0.2)",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    color: "#f3ebdd",
                    outline: "none",
                    fontSize: "0.95rem",
                    width: "100%"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(201, 166, 107, 0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(197, 168, 128, 0.2)"}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "#a3957f", textTransform: "uppercase", letterSpacing: "1px" }}>Nueva Contraseña</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(197, 168, 128, 0.2)",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  color: "#f3ebdd",
                  outline: "none",
                  fontSize: "0.95rem",
                  width: "100%"
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(201, 166, 107, 0.6)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(197, 168, 128, 0.2)"}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "#a3957f", textTransform: "uppercase", letterSpacing: "1px" }}>Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la nueva contraseña"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(197, 168, 128, 0.2)",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  color: "#f3ebdd",
                  outline: "none",
                  fontSize: "0.95rem",
                  width: "100%"
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(201, 166, 107, 0.6)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(197, 168, 128, 0.2)"}
              />
            </div>

            {error && (
              <div style={{ color: "#db5757", fontSize: "0.88rem", marginTop: "4px", textAlign: "center" }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #c5a880 0%, #9e825a 100%)",
                border: "none",
                color: "#1a1712",
                padding: "14px",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
                marginTop: "12px",
                transition: "all 0.2s"
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <KeyRound size={20} />
                  <span>Establecer Contraseña</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
