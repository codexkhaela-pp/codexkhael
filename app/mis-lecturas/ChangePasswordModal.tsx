"use client";

import { useState } from "react";
import { Settings, X, Loader2 } from "lucide-react";

export default function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false);
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
          setIsOpen(false);
          setSuccess(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch (err) {
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '50%',
          transition: 'all 0.2s ease',
        }}
        title="Cambiar Contraseña"
        onMouseEnter={(e) => e.currentTarget.style.color = '#c9a66b'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
      >
        <Settings size={18} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 6, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(13, 15, 22, 0.95)',
            border: '1px solid rgba(201, 166, 107, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#6a6575',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: '1.6rem',
              color: '#f3ebdd',
              marginBottom: '8px',
              fontWeight: 400
            }}>
              Seguridad
            </h2>
            <p style={{ color: '#a19ba8', fontSize: '0.9rem', marginBottom: '24px' }}>
              Actualiza tu contraseña para mantener tu espacio privado seguro.
            </p>

            {success ? (
              <div style={{
                background: 'rgba(78, 189, 137, 0.1)',
                border: '1px solid rgba(78, 189, 137, 0.3)',
                color: '#4ebd89',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '0.95rem'
              }}>
                Tu contraseña ha sido actualizada con éxito.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a19ba8' }}>Contraseña actual</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      color: '#f3ebdd',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(201, 166, 107, 0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a19ba8' }}>Nueva contraseña</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      color: '#f3ebdd',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(201, 166, 107, 0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a19ba8' }}>Confirmar nueva contraseña</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      color: '#f3ebdd',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(201, 166, 107, 0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>

                {error && (
                  <div style={{ color: '#db5757', fontSize: '0.85rem', marginTop: '4px' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#a19ba8',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f3ebdd'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#a19ba8'}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #d7ad69 0%, #b88a44 100%)',
                      border: 'none',
                      color: '#000',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
