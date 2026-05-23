import { PlanTier } from "./plans";

// Utility to get the first sentence of a text
function getPreviewText(text: string): string {
  if (!text) return "";
  // Find the first period followed by a space or end of string
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  if (match) {
    return match[0].trim();
  }
  return text.trim();
}

const LOCKED_PLACEHOLDERS = {
  detalle: "🔒 Interpretación profunda (PRO)",
  consejo: "🔒 Consejo práctico (PRO)",
  preguntas: ["🔒 Pregunta de reflexión (PRO)"],
};

export function filtrarCartaPorPlan(carta: any, plan: PlanTier): any {
  // Deep copy to avoid mutating the original JSON in memory
  const filtered = JSON.parse(JSON.stringify(carta));

  if (plan === "PRO") {
    return filtered; // PRO gets everything
  }

  if (plan === "FREE") {
    // Resumen reducido a la primera oración
    if (filtered.resumen) {
      filtered.resumen.derecho = getPreviewText(filtered.resumen.derecho);
      filtered.resumen.invertido = getPreviewText(filtered.resumen.invertido);
    }

    // Amor reducido + Placeholders
    if (filtered.ambitos && filtered.ambitos.amor) {
      ["derecho", "invertido"].forEach((ori) => {
        if (filtered.ambitos.amor[ori]) {
          filtered.ambitos.amor[ori].general = getPreviewText(filtered.ambitos.amor[ori].general);
          filtered.ambitos.amor[ori].detalle = LOCKED_PLACEHOLDERS.detalle;
          filtered.ambitos.amor[ori].consejo = LOCKED_PLACEHOLDERS.consejo;
          filtered.ambitos.amor[ori].preguntas = LOCKED_PLACEHOLDERS.preguntas;
          delete filtered.ambitos.amor[ori].bloques;
        }
      });
    }

    // Remove other ambitos completely from payload
    if (filtered.ambitos) {
      delete filtered.ambitos.trabajo;
      delete filtered.ambitos.dinero;
      delete filtered.ambitos.salud;
      delete filtered.ambitos.viajes;
      delete filtered.ambitos.espiritual;
      delete filtered.ambitos.simbologia;
    }
    delete filtered.simbologia;

    return filtered;
  }

  if (plan === "BASIC") {
    // Resumen completo (no changes)
    // Amor completo (no changes)
    
    // Trabajo, dinero, salud: General is full, but deep insights are locked
    if (filtered.ambitos) {
      const basicAmbitos = ["trabajo", "dinero", "salud"];
      basicAmbitos.forEach((ambito) => {
        if (filtered.ambitos[ambito]) {
          ["derecho", "invertido"].forEach((ori) => {
            if (filtered.ambitos[ambito][ori]) {
              // We leave .general as is (full text)
              filtered.ambitos[ambito][ori].detalle = LOCKED_PLACEHOLDERS.detalle;
              filtered.ambitos[ambito][ori].consejo = LOCKED_PLACEHOLDERS.consejo;
              filtered.ambitos[ambito][ori].preguntas = LOCKED_PLACEHOLDERS.preguntas;
              delete filtered.ambitos[ambito][ori].bloques;
            }
          });
        }
      });

      // Remove PRO ambitos completely
      delete filtered.ambitos.viajes;
      delete filtered.ambitos.espiritual;
      delete filtered.ambitos.simbologia;
    }
    delete filtered.simbologia;

    return filtered;
  }

  return filtered; // Fallback
}
