"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, BookOpen } from "lucide-react";
import { createClientReading } from "../actions";
import styles from "./nueva-lectura.module.css";

export default function NuevaLecturaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{ isNewClient: boolean, generatedPassword?: string | null, clientEmail: string } | null>(null);

  // Form State for Live Preview
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    title: "",
    mainQuestion: "",
    category: "General",
    spreadType: "Tres Cartas",
    readingDate: new Date().toISOString().split("T")[0],
    realDeckName: "",
    realDeckPublisher: "",
    realDeckAuthor: "",
    realDeckIllustrator: "",
    realDeckYear: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        ...formData,
        readingDate: new Date(formData.readingDate)
      };
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
      <div className={styles.container}>
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

          <button className={styles.btnPrimary} onClick={() => router.push("/admin/lecturas")}>
            Continuar al gestor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* HEADER INTEGRATED */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin/lecturas" className={styles.backLink}>
            &larr; Volver al Gestor
          </Link>
          <h1 className={styles.headerTitle}>
            Nueva <br/><span className={styles.headerTitleHighlight}>Lectura</span>
          </h1>
          <p className={styles.headerSubtitle}>
            Registra una nueva consulta y prepara el espacio de lectura para tu consultante.
          </p>
        </div>
        <div className={styles.headerRight}>
          <img src="/assets/landing/imagen_principal.png" alt="Preparación de lectura" className={styles.headerImage} />
        </div>
      </header>

      {/* MAIN GRID LAYOUT */}
      <main className={styles.mainLayout}>
        
        {/* LEFT COLUMN: FORM */}
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} id="readingForm">
            
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Datos del consultante</h2>
              <div className={styles.grid2Cols}>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Nombre del consultante</span>
                  <input 
                    type="text" 
                    name="clientName" 
                    required 
                    placeholder="Ej: María Pérez" 
                    className={styles.input}
                    value={formData.clientName}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Correo electrónico <span className={styles.labelOptional}>(OPCIONAL)</span></span>
                  <input 
                    type="email" 
                    name="clientEmail" 
                    placeholder="correo@cliente.com" 
                    className={styles.input}
                    value={formData.clientEmail}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Información de la consulta</h2>
              <div className={styles.fieldGroup} style={{ marginBottom: "20px" }}>
                <span className={styles.label}>Título de la lectura</span>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="Lectura General Anual" 
                  className={styles.input}
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.label}>Pregunta principal</span>
                <textarea 
                  name="mainQuestion" 
                  required 
                  placeholder="¿Qué energías me acompañan este año?" 
                  className={styles.textarea}
                  value={formData.mainQuestion}
                  onChange={handleChange}
                  maxLength={500}
                ></textarea>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p className={styles.hintText}>Formula una pregunta concreta para obtener una lectura más clara y útil.</p>
                  <span className={styles.charCount}>{formData.mainQuestion.length}/500</span>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Configuración de la tirada</h2>
              <div className={styles.grid3Cols}>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Categoría</span>
                  <select 
                    name="category" 
                    required 
                    className={styles.select}
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="General">General</option>
                    <option value="Amor">Amor</option>
                    <option value="Trabajo">Trabajo</option>
                    <option value="Dinero">Dinero</option>
                    <option value="Familia">Familia</option>
                    <option value="Decisiones">Decisiones</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Tipo de Tirada</span>
                  <select 
                    name="spreadType" 
                    required 
                    className={styles.select}
                    value={formData.spreadType}
                    onChange={handleChange}
                  >
                    <option value="Tres Cartas">Tres Cartas</option>
                    <option value="Cinco Cartas">Cinco Cartas</option>
                    <option value="Cruz Celta">Cruz Celta</option>
                    <option value="Herradura">Herradura</option>
                    <option value="Personalizada">Personalizada</option>
                  </select>
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Fecha de la lectura</span>
                  <input 
                    type="date" 
                    name="readingDate" 
                    required 
                    className={styles.input}
                    style={{ colorScheme: "dark" }}
                    value={formData.readingDate}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Detalles de la Baraja (Opcional)</h2>
              <p style={{color: "var(--muted)", fontSize: "0.85rem", marginBottom: "16px"}}>
                Estos datos añaden autenticidad a la lectura, mostrando al cliente el origen de las cartas utilizadas.
              </p>
              
              <div className={styles.grid2Cols} style={{ marginBottom: "20px" }}>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Nombre de la Baraja</span>
                  <input 
                    type="text" 
                    name="realDeckName" 
                    placeholder="Ej: Rider Waite Smith" 
                    className={styles.input}
                    value={formData.realDeckName}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Editorial</span>
                  <input 
                    type="text" 
                    name="realDeckPublisher" 
                    placeholder="Ej: U.S. Games Systems" 
                    className={styles.input}
                    value={formData.realDeckPublisher}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className={styles.grid3Cols}>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Autor</span>
                  <input 
                    type="text" 
                    name="realDeckAuthor" 
                    placeholder="Ej: Arthur E. Waite" 
                    className={styles.input}
                    value={formData.realDeckAuthor}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Ilustrador</span>
                  <input 
                    type="text" 
                    name="realDeckIllustrator" 
                    placeholder="Ej: Pamela Colman Smith" 
                    className={styles.input}
                    value={formData.realDeckIllustrator}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.label}>Año de edición</span>
                  <input 
                    type="text" 
                    name="realDeckYear" 
                    placeholder="Ej: 1909" 
                    className={styles.input}
                    value={formData.realDeckYear}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                type="button" 
                onClick={() => router.push("/admin/lecturas")} 
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={styles.btnPrimary}
              >
                {isSubmitting ? "Guardando..." : "Crear Borrador de Lectura"}
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: SUMMARY & CONTEXT */}
        <aside className={styles.stickySidebar}>
          
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Resumen de la lectura</h3>
            
            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Consultante</span>
                <span className={formData.clientName ? styles.summaryValue : `${styles.summaryValue} ${styles.summaryValueEmpty}`}>
                  {formData.clientName || "Sin definir"}
                </span>
              </div>
              
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Título</span>
                <span className={formData.title ? styles.summaryValue : `${styles.summaryValue} ${styles.summaryValueEmpty}`}>
                  {formData.title || "Sin definir"}
                </span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Categoría</span>
                <span className={styles.summaryValue}>{formData.category}</span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Tirada</span>
                <span className={styles.summaryValue}>{formData.spreadType}</span>
                <div className={styles.spreadIndicator}>
                  <BookOpen className={styles.spreadIcon} />
                  {formData.spreadType}
                </div>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Fecha</span>
                <span className={styles.summaryValue}>
                  {formData.readingDate ? new Date(formData.readingDate + "T12:00:00").toLocaleDateString('es-ES') : "Sin definir"}
                </span>
              </div>
              
              {formData.realDeckName && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Baraja Utilizada</span>
                  <span className={styles.summaryValue}>{formData.realDeckName}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.consejoCard}>
            <Sparkles size={18} className={styles.consejoIcon} />
            <div>
              <span className={styles.consejoTitle}>Consejo</span>
              <p className={styles.consejoText}>
                Sé claro y específico. Una pregunta bien formulada ayuda a obtener una lectura más precisa y significativa.
              </p>
            </div>
          </div>

        </aside>

      </main>

    </div>
  );
}
