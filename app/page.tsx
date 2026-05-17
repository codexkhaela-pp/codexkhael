import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page">
      <header>
        <a className="brand" href="#">
          <span className="brand-mark">✦</span>
          <span>CodexKhael</span>
        </a>
        <nav>
          <a href="#metodo">Metodo</a>
          <a href="#v1">Plataforma</a>
          <a href="#acceso">Acceso</a>
        </nav>
        <Link className="btn btn-primary header-access" href="/dashboard">
          Acceder
        </Link>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="badge">
              <span />
              Plataforma en construccion
            </div>
            <h1>Tarot con estructura, intuicion y memoria.</h1>
            <p>
              CodexKhael sera un espacio digital para estudiar tarot, registrar tiradas,
              practicar interpretaciones y construir tu propio grimorio vivo con una metodologia
              clara.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/dashboard">
                Acceder
              </Link>
              <a className="btn btn-secondary" href="#v1">
                Ver que incluira
              </a>
            </div>
          </div>

          <aside className="hero-card" aria-label="Vista previa de una lectura">
            <div className="card-title">
              <span>Tirada de practica</span>
              <span>Preview</span>
            </div>
            <div className="reading">
              <div className="tarot-card">
                Carta
                <br />1
              </div>
              <div className="tarot-card">
                Carta
                <br />2
              </div>
              <div className="tarot-card">
                Carta
                <br />3
              </div>
            </div>
            <div className="analysis">
              Guarda la pregunta, registra las cartas, define posiciones y desarrolla una lectura
              concreta, ordenada y facil de revisar despues.
            </div>
          </aside>
        </section>

        <section className="section" id="metodo">
          <h2>No sera solo una web de tarot.</h2>
          <p className="section-intro">
            La idea de CodexKhael es combinar estudio, practica y registro personal. Menos ruido,
            mas metodo. Menos frases genericas, mas interpretacion concreta.
          </p>
          <div className="grid">
            <article className="feature">
              <strong>Grimorio digital</strong>
              <p>
                Un espacio para ordenar significados, notas, simbolos, asociaciones y aprendizajes
                por carta.
              </p>
            </article>
            <article className="feature">
              <strong>Registro de tiradas</strong>
              <p>
                Guarda preguntas, cartas, posiciones, contexto e interpretacion final para consultar
                tu evolucion.
              </p>
            </article>
            <article className="feature">
              <strong>Practica guiada</strong>
              <p>
                Ejercicios para entrenar lectura concreta, conexion entre cartas y analisis por
                posiciones.
              </p>
            </article>
          </div>
        </section>

        <section className="section" id="v1">
          <h2>Plataforma inicial.</h2>
          <p className="section-intro">
            La plataforma inicial se enfocara en lo esencial: estudiar, practicar y registrar. La
            IA vendra despues, cuando el metodo base este firme.
          </p>
          <div className="grid">
            <article className="feature">
              <strong>Biblioteca de cartas</strong>
              <p>Arcanos mayores y menores con significados editables y notas personales.</p>
            </article>
            <article className="feature">
              <strong>Diferentes tiradas</strong>
              <p>
                Carta del dia, cruz celta, cruz celta aspiracional, kabala, lectura mensual y otros
                esquemas de practica.
              </p>
            </article>
            <article className="feature">
              <strong>Diario de aprendizaje</strong>
              <p>Historial de practicas para revisar patrones, errores y avances reales.</p>
            </article>
          </div>
        </section>

        <section className="coming" id="acceso">
          <div>
            <h2>Acceso anticipado proximamente.</h2>
            <p>CodexKhael esta en construccion. Primero sera solido, luego bonito, luego inteligente.</p>
          </div>
          <a className="btn btn-primary" href="mailto:hola@codexkhael.com">
            Contactar
          </a>
        </section>
      </main>

      <footer>
        <span>© 2026 CodexKhael</span>
        <span>Creado por Khael Tarotista</span>
      </footer>
    </div>
  );
}

