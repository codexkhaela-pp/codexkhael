import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-label="Recuperar contraseña">
        <div className={styles.iconWrapper}>
          <Mail strokeWidth={1.5} />
        </div>
        <span className={styles.kicker}>Recuperación</span>
        <h1 className={styles.title}>¿Olvidaste tu contraseña?</h1>
        <p className={styles.description}>
          Introduce tu correo y te enviaremos instrucciones para restablecerla.
        </p>
        
        <ForgotPasswordForm />
        
        <div className={styles.divider}>✦</div>
        
        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
