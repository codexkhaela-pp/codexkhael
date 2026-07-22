"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Step = 1 | 2;

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type Plan = {
  id: "free" | "basic" | "pro";
  image: string;
  title: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  buttonLabel: string;
  tone: "gold" | "violet";
  ribbon?: string;
  accentFeature?: string;
  includesNote?: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const plans: Plan[] = [
  {
    id: "free",
    image: "/assets/suscribete/suscribete2.png",
    title: "FREE",
    description: '"Descubre el Tarot"',
    price: "Gratis",
    features: [
      "78 cartas disponibles",
      "Tiradas básicas (3 cartas)",
      "Bitácora hasta 20 entradas",
      "5 interpretaciones IA por día",
      "Interpretaciones simples",
      "1 tirada guiada",
    ],
    buttonLabel: "Comenzar gratis",
    tone: "gold",
  },
  {
    id: "basic",
    image: "/assets/suscribete/suscribete3.png",
    title: "BÁSICO",
    description: '"Desarrolla tu intuición"',
    price: "S/ 9.90",
    period: "/mes",
    features: [
      "Tiradas ilimitadas",
      "Bitácora ilimitada",
      "Relecturas (comentarios)",
      "Historial completo",
      "XP + racha",
      "Alertas de cartas difíciles",
      "20 interpretaciones IA por día",
      "Interpretaciones más completas",
      "Guardado de tiradas en canvas",
    ],
    buttonLabel: "Elegir Básico",
    tone: "gold",
    ribbon: "Más popular",
  },
  {
    id: "pro",
    image: "/assets/suscribete/suscribete4.png",
    title: "PRO",
    description: '"Maestría y guía avanzada"',
    price: "S/ 24.90",
    period: "/mes",
    features: [
      "IA sin límites",
      "Interpretaciones guiadas paso a paso (modo mentor)",
      "Análisis de patrones",
      "Insights automáticos",
      "Exportar a PDF (grimorio)",
      "Tiradas avanzadas",
      "Acceso anticipado a nuevas funciones",
    ],
    buttonLabel: "Elegir Pro",
    tone: "violet",
    ribbon: "Avanzado",
    accentFeature: "Respuestas detalladas y explicadas",
    includesNote: "Incluye todo lo del plan Básico",
  },
];

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Ingresa tu nombre.";
  }

  if (!form.email.trim() || !form.email.includes("@")) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (form.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

export function SuscribeteFlow() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedPlan, setSelectedPlan] = useState<Plan["id"] | null>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planSuccess, setPlanSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const stepOneComplete = step === 2;

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function onSubmitStepOne(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStep(2);
    setPlanError("");
    setPlanSuccess("");
  }

  async function onSelectPlan(planId: Plan["id"]) {
    if (isSubmittingPlan) {
      return;
    }

    setSelectedPlan(planId);
    setPlanError("");
    setPlanSuccess("");
    setIsSubmittingPlan(true);

    try {
      const response = await fetch("/api/auth/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          plan: planId.toUpperCase(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; requiresPayment?: boolean }
        | null;

      if (!response.ok) {
        setPlanError(payload?.error ?? "No se pudo completar la suscripción.");
        return;
      }

      setPlanSuccess(
        payload?.message ??
          (payload?.requiresPayment
            ? "Tu cuenta fue creada y quedó pendiente de pago."
            : "Tu cuenta fue creada. Ya puedes iniciar sesión."),
      );
    } catch {
      setPlanError("Ocurrió un error al crear tu cuenta.");
    } finally {
      setIsSubmittingPlan(false);
    }
  }

  return (
    <main className="subscribe-page">
      <div className="subscribe-shell">
        <header className="landing-header subscribe-topbar">
          <Link className="landing-brand" href="/" aria-label="Khael Tarotista">
            <Image 
              src="/assets/brand/final-01.png" 
              alt="Khael Tarotista Logo" 
              width={65} 
              height={65}
              priority
              className="landing-brand-logo-img"
              style={{ objectFit: "contain" }}
            />
          </Link>

          <nav className="landing-nav" aria-label="Navegación principal">
            <Link href="/">Inicio</Link>
            <Link href="/lecturas">Lecturas</Link>
            <Link href="/carta-del-dia">Carta del Día</Link>
            <Link className="is-active" href="/codex-khael">
              Codex Khael
            </Link>
            <Link href="/acerca-de-mi">Sobre mí</Link>
          </nav>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link className="landing-access" href="/mis-lecturas/login" prefetch={false} style={{ background: 'transparent', borderColor: 'rgba(215, 173, 105, 0.4)' }}>
              Mis Lecturas <span>+</span>
            </Link>
            <Link className="landing-access" href="/login" prefetch={false}>
              Acceso a Codex <span>+</span>
            </Link>
          </div>
        </header>

        <div className="subscribe-header">
          <ol className="subscribe-progress" aria-label="Progreso de suscripción">
            <li className={`subscribe-progress__step ${step === 1 ? "is-current" : "is-complete"}`}>
              <span className="subscribe-progress__dot" aria-hidden="true">
                {stepOneComplete ? "✓" : "1"}
              </span>
              <span className="subscribe-progress__label">Crear tu acceso</span>
              <i aria-hidden="true" />
            </li>

            <li className={`subscribe-progress__step ${step === 2 ? "is-current" : ""}`}>
              <span className="subscribe-progress__dot" aria-hidden="true">
                2
              </span>
              <span className="subscribe-progress__label">Elegir tu plan</span>
            </li>
          </ol>
        </div>

        {step === 1 ? (
          <section className="subscribe-step subscribe-step--account" aria-labelledby="subscribe-step-1-title">
            <div className="subscribe-step__copy">
              <p className="subscribe-step__eyebrow">Paso 1 de 2</p>
              <h1 id="subscribe-step-1-title">Crea tu acceso a Códex Kahel</h1>
              <div className="subscribe-step__divider" aria-hidden="true">
                <i />
                <span>✦</span>
                <i />
              </div>
              <p className="subscribe-step__lead">
                Completa tus datos para crear tu cuenta y continuar eligiendo tu plan ideal.
              </p>

              <div className="subscribe-step__art" aria-hidden="true">
                <Image
                  src="/assets/suscribete/suscribete1.png"
                  alt=""
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 38vw"
                />
              </div>
            </div>

            <div className="subscribe-step__panel">
              <form className="subscribe-form" onSubmit={onSubmitStepOne} noValidate>
                <label className="subscribe-field">
                  <span>Nombre</span>
                  <div className="subscribe-input">
                    <i aria-hidden="true">◌</i>
                    <input
                      type="text"
                      name="name"
                      placeholder="Ingresa tu nombre"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                    />
                  </div>
                  {errors.name ? <small>{errors.name}</small> : null}
                </label>

                <label className="subscribe-field">
                  <span>Correo electrónico</span>
                  <div className="subscribe-input">
                    <i aria-hidden="true">✉</i>
                    <input
                      type="email"
                      name="email"
                      placeholder="ejemplo@correo.com"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                  </div>
                  {errors.email ? <small>{errors.email}</small> : null}
                </label>

                <label className="subscribe-field">
                  <span>Contraseña</span>
                  <div className="subscribe-input">
                    <i aria-hidden="true">⌂</i>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Crea una contraseña"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                    <button
                      className="subscribe-visibility"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? "◐" : "◌"}
                    </button>
                  </div>
                  {errors.password ? <small>{errors.password}</small> : null}
                </label>

                <label className="subscribe-field">
                  <span>Confirmar contraseña</span>
                  <div className="subscribe-input">
                    <i aria-hidden="true">⌂</i>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirma tu contraseña"
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                    />
                    <button
                      className="subscribe-visibility"
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                    >
                      {showConfirmPassword ? "◐" : "◌"}
                    </button>
                  </div>
                  {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
                </label>

                <button className="subscribe-primary" type="submit">
                  Continuar <span>✦</span>
                </button>
              </form>

              <p className="subscribe-note">
                <span aria-hidden="true">⌂</span> Tu información está protegida y segura.
              </p>
            </div>
          </section>
        ) : (
          <section className="subscribe-step subscribe-step--plans" aria-labelledby="subscribe-step-2-title">
            <div className="subscribe-step__intro">
              <button className="subscribe-back" type="button" onClick={() => setStep(1)}>
                ← Volver al paso 1
              </button>
              <p className="subscribe-step__eyebrow">Paso 2 de 2</p>
              <h1 id="subscribe-step-2-title">Elige tu camino en Códex Kahel</h1>
              <div className="subscribe-step__divider" aria-hidden="true">
                <i />
                <span>✦</span>
                <i />
              </div>
              <p className="subscribe-step__lead subscribe-step__lead--center">
                Selecciona el plan que mejor se adapte a tu momento. Solo un plan puede quedar seleccionado.
              </p>
            </div>

            <div className="subscribe-plans" role="list" aria-label="Planes disponibles">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <article
                    className={[
                      "subscribe-plan",
                      plan.ribbon === "Más popular" ? "is-featured" : "",
                      plan.tone === "violet" ? "is-violet" : "",
                      isSelected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={plan.id}
                    role="listitem"
                  >
                    {plan.ribbon ? <p className="subscribe-plan__badge">{plan.ribbon}</p> : null}

                    <div className="subscribe-plan__symbol" aria-hidden="true">
                      <Image src={plan.image} alt="" width={108} height={108} unoptimized sizes="108px" />
                    </div>

                    <h2>{plan.title}</h2>
                    <p className="subscribe-plan__price">
                      {plan.price}
                      {plan.period ? <span>{plan.period}</span> : null}
                    </p>
                    <p className="subscribe-plan__description">{plan.description}</p>

                    <div className="subscribe-plan__divider" aria-hidden="true">
                      <i />
                      <span>✦</span>
                      <i />
                    </div>

                    <ul>
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <span aria-hidden="true">●</span>
                          {feature}
                        </li>
                      ))}
                      {plan.accentFeature ? (
                        <li className="subscribe-plan__accent">
                          <span aria-hidden="true">✦</span>
                          {plan.accentFeature}
                        </li>
                      ) : null}
                      {plan.includesNote ? (
                        <li className="subscribe-plan__note">
                          <span aria-hidden="true">●</span>
                          {plan.includesNote}
                        </li>
                      ) : null}
                    </ul>

                    <button
                      className="subscribe-plan__cta"
                      type="button"
                      onClick={() => onSelectPlan(plan.id)}
                      disabled={isSubmittingPlan}
                    >
                      {isSubmittingPlan && isSelected ? "Procesando..." : plan.buttonLabel}
                    </button>
                  </article>
                );
              })}
            </div>

            {planError ? <p className="subscribe-plan-feedback subscribe-plan-feedback--error">{planError}</p> : null}
            {planSuccess ? (
              <p className="subscribe-plan-feedback subscribe-plan-feedback--success">{planSuccess}</p>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
