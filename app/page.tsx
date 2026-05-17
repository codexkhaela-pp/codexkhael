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
          <a href="#metodo">Método</a>
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
              Plataforma en construcción
            </div>
            <h1>Tarot con estructura, intuición y memoria.</h1>
            <p>
              CodexKhael será un espacio digital para estudiar tarot, registrar tiradas, practicar
              interpretaciones y construir tu propio grimorio vivo con una metodología clara.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/dashboard">
                Acceder
              </Link>
              <a className="btn btn-secondary" href="#v1">
                Ver qué incluirá
              </a>
            </div>
          </div>

          <aside className="hero-card" aria-label="Vista previa de una lectura">
            <div className="card-title">
              <span>Tirada de práctica</span>
              <span>Vista previa</span>
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
              concreta, ordenada y fácil de revisar después.
            </div>
          </aside>
        </section>

        <section className="section" id="metodo">
          <h2>No será solo una web de tarot.</h2>
          <p className="section-intro">
            La idea de CodexKhael es combinar estudio, práctica y registro personal. Menos ruido,
            más método. Menos frases genéricas, más interpretación concreta.
          </p>
          <div className="grid">
            <article className="feature">
              <strong>Grimorio digital</strong>
              <p>
                Un espacio para ordenar significados, notas, símbolos, asociaciones y aprendizajes
                por carta.
              </p>
            </article>
            <article className="feature">
              <strong>Registro de tiradas</strong>
              <p>
                Guarda preguntas, cartas, posiciones, contexto e interpretación final para consultar
                tu evolución.
              </p>
            </article>
            <article className="feature">
              <strong>Práctica guiada</strong>
              <p>
                Ejercicios para entrenar lectura concreta, conexión entre cartas y análisis por
                posiciones.
              </p>
            </article>
          </div>
        </section>

        <section className="section" id="v1">
          <h2>Plataforma inicial</h2>
          <p className="section-intro">
            La plataforma inicial se enfocará en lo esencial: estudiar, practicar y registrar. La
            IA vendrá después, cuando el método base esté firme.
          </p>
          <div className="grid">
            <article className="feature">
              <strong>Biblioteca de cartas</strong>
              <p>Arcanos mayores y menores con significados editables y notas personales.</p>
            </article>
            <article className="feature">
              <strong>Diferentes tiradas</strong>
              <p>
                Carta del día, cruz celta, cruz celta aspiracional, kábala, lectura mensual y otros
                esquemas de práctica.
              </p>
            </article>
            <article className="feature">
              <strong>Diario de aprendizaje</strong>
              <p>Historial de prácticas para revisar patrones, errores y avances reales.</p>
            </article>
          </div>
        </section>

        <section className="coming" id="acceso">
          <div>
            <h2>Acceso anticipado próximamente.</h2>
            <p>
              CodexKhael está en construcción. Primero será sólido, luego bonito, luego
              inteligente.
            </p>
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
