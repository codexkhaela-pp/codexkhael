"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientReading } from "../actions";

export default function NuevaLecturaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{ isNewClient: boolean, generatedPassword?: string | null, clientEmail: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      clientEmail: formData.get("clientEmail") as string,
      clientName: formData.get("clientName") as string,
      mainQuestion: formData.get("mainQuestion") as string,
      category: formData.get("category") as string,
      spreadType: formData.get("spreadType") as string,
      readingDate: new Date(formData.get("readingDate") as string),
    };

    try {
      const result = await createClientReading(data);
      if (result.success) {
        if (result.isNewClient) {
          setResultData(result as any);
        } else {
          router.push(`/admin/lecturas/${result.readingId}`);
        }
      }
    } catch (err) {
      alert("Error al crear lectura");
      setIsSubmitting(false);
    }
  }

  if (resultData) {
    return (
      <div className="panel-container">
        <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "2rem", background: "rgba(5,6,10,0.8)", border: "1px solid var(--landing-gold-2)", borderRadius: "12px", textAlign: "center" }}>
          <h2 style={{ color: "var(--landing-gold-1)", marginBottom: "1rem" }}>¡Cliente Registrado!</h2>
          <p style={{ marginBottom: "2rem" }}>Se ha creado la cuenta para el consultante con el correo <strong>{resultData.clientEmail}</strong>.</p>
          
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Contraseña temporal generada:</p>
            <div style={{ fontSize: "2rem", fontFamily: "monospace", letterSpacing: "2px", color: "white" }}>
              {resultData.generatedPassword}
            </div>
          </div>
          
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
            Por favor, copia esta contraseña y envíasela al cliente. 
            El cliente podrá ingresar a <strong>/mis-lecturas/login</strong> con estas credenciales.
          </p>

          <button className="btn btn-primary" onClick={() => router.push("/admin/lecturas")}>
            Continuar al gestor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-container">
      <header className="panel-header" style={{ marginBottom: "2rem" }}>
        <h1 className="panel-title">Nueva Lectura</h1>
        <p className="panel-subtitle">Registra una nueva consulta para un cliente</p>
      </header>

      <section className="panel-section" style={{ maxWidth: "800px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <label className="login-form__field">
              <span>Nombre del Consultante</span>
              <input type="text" name="clientName" required placeholder="Ej: María Pérez" style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </label>
            <label className="login-form__field">
              <span>Correo Electrónico</span>
              <input type="email" name="clientEmail" required placeholder="correo@cliente.com" style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </label>
          </div>

          <label className="login-form__field">
            <span>Título de la Lectura</span>
            <input type="text" name="title" required placeholder="Lectura General Anual" style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
          </label>

          <label className="login-form__field">
            <span>Pregunta Principal</span>
            <textarea name="mainQuestion" rows={3} required placeholder="¿Qué energías me acompañan este año?" style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}></textarea>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
            <label className="login-form__field">
              <span>Categoría</span>
              <select name="category" required style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <option value="General">General</option>
                <option value="Amor">Amor</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Dinero">Dinero</option>
                <option value="Familia">Familia</option>
                <option value="Decisiones">Decisiones</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <label className="login-form__field">
              <span>Tipo de Tirada</span>
              <select name="spreadType" required style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <option value="Tres Cartas">Tres Cartas</option>
                <option value="Cinco Cartas">Cinco Cartas</option>
                <option value="Cruz Celta">Cruz Celta</option>
                <option value="Herradura">Herradura</option>
                <option value="Personalizada">Personalizada</option>
              </select>
            </label>
            <label className="login-form__field">
              <span>Fecha de la Lectura</span>
              <input type="date" name="readingDate" defaultValue={new Date().toISOString().split("T")[0]} required style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", colorScheme: "dark" }} />
            </label>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Guardando..." : "Crear Borrador de Lectura"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)" }}>
              Cancelar
            </button>
          </div>

        </form>
      </section>
    </div>
  );
}
