"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type CartaDelDiaResponse = {
  id: string;
  cardId: string;
  orientation: "UPRIGHT" | "REVERSED";
  isRevealed: boolean;
  mensajeDia: string;
  preguntaReflexion: string;
  cardImage: string;
  cardName: string;
  hasReflection: boolean;
};

export default function CartaDelDiaPage() {
  const router = useRouter();
  const [carta, setCarta] = useState<CartaDelDiaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [sintioEnergia, setSintioEnergia] = useState("MUCHO");
  const [aprendizaje, setAprendizaje] = useState("");
  const [moodLevel, setMoodLevel] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // We will create a GET endpoint to fetch current daily card
    fetch("/api/carta-del-dia")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setCarta(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleReveal = async () => {
    if (!carta || carta.isRevealed || revealing) return;
    setRevealing(true);
    try {
      const res = await fetch("/api/carta-del-dia/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaId: carta.id }),
      });
      if (res.ok) {
        setCarta({ ...carta, isRevealed: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevealing(false);
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carta || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/carta-del-dia/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartaId: carta.id,
          sintioEnergia,
          textoReflexion: reflectionText,
          aprendizaje,
          moodLevel,
        }),
      });
      if (res.ok) {
        setCarta({ ...carta, hasReflection: true });
      } else {
        alert("Ocurrió un error al guardar la reflexión");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[var(--gold)]">
        Conectando con el oráculo...
      </div>
    );
  }

  if (!carta) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error al cargar la carta del día.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-serif text-[var(--gold-bright)] mb-2">Carta del Día</h1>
        <p className="text-sm text-[var(--text-muted)] tracking-wider uppercase">Tu Guía Diaria</p>
      </header>

      <div className="flex flex-col items-center gap-10">
        {/* Card Section */}
        <div 
          className="relative w-[45vw] max-w-[160px] h-[280px] perspective-1000 cursor-pointer"
          onClick={handleReveal}
        >
          <div className={`w-full h-full transition-transform duration-700 transform-style-3d ${carta.isRevealed ? 'rotate-y-180' : ''}`}>
            {/* Back */}
            <div className="absolute w-full h-full backface-hidden rounded-xl border border-[rgba(201,166,107,0.3)] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden" style={{ background: "linear-gradient(135deg, #18142c 0%, #0e0d19 100%)" }}>
              <div className="absolute inset-2 border border-dashed border-[rgba(201,166,107,0.2)] rounded-lg flex items-center justify-center">
                <span className="text-5xl opacity-40">🔮</span>
              </div>
            </div>

            {/* Front */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(197,168,128,0.15)] bg-transparent">
              {carta.isRevealed && (
                <Image
                  src={carta.cardImage}
                  alt={carta.cardName}
                  fill
                  className={`object-contain drop-shadow-xl ${carta.orientation === "REVERSED" ? "rotate-180" : ""}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Message Section */}
        {carta.isRevealed && (
          <div className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(201,166,107,0.2)] rounded-xl p-6 text-center animate-fade-in">
            <h2 className="text-xl font-serif text-[var(--gold)] mb-4">{carta.cardName} {carta.orientation === "REVERSED" ? "(Invertida)" : ""}</h2>
            <p className="text-[#e0d9cd] leading-relaxed mb-6">{carta.mensajeDia}</p>
            
            <div className="bg-[#110f1f] p-5 rounded-lg border-l-2 border-[var(--gold)] text-left">
              <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Para reflexionar hoy:</span>
              <p className="text-[var(--text-light)] italic">"{carta.preguntaReflexion}"</p>
            </div>
          </div>
        )}

        {/* Reflection Form */}
        {carta.isRevealed && !carta.hasReflection && (
          <div className="w-full mt-4 animate-fade-in-up">
            <div className="parchment-container !block text-[#332a21]">
              <h3 className="font-serif text-xl font-bold text-[#211912] mb-4 text-center">Reflexión Nocturna</h3>
              <form onSubmit={handleSaveReflection} className="flex flex-col gap-5 relative z-10">
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7d6f5e] mb-2">¿Cómo sentiste la energía de la carta hoy?</label>
                  <select 
                    value={sintioEnergia} 
                    onChange={e => setSintioEnergia(e.target.value)}
                    className="w-full p-2 bg-[#fdfaf2] border border-[#eadebe] rounded-md text-[#332a21] outline-none focus:border-[#c5a880]"
                  >
                    <option value="MUCHO">Muy presente</option>
                    <option value="POCO">Algo sutil</option>
                    <option value="NADA">No la percibí</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7d6f5e] mb-2">Tu Diario (Responde a la pregunta de reflexión)</label>
                  <textarea 
                    value={reflectionText}
                    onChange={e => setReflectionText(e.target.value)}
                    required
                    rows={4}
                    className="w-full p-3 bg-[#fdfaf2] border border-[#eadebe] rounded-md text-[#332a21] outline-none focus:border-[#c5a880] resize-none"
                    placeholder="Escribe aquí tus pensamientos..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7d6f5e] mb-2">Mayor aprendizaje del día</label>
                  <input 
                    type="text"
                    value={aprendizaje}
                    onChange={e => setAprendizaje(e.target.value)}
                    required
                    className="w-full p-2 bg-[#fdfaf2] border border-[#eadebe] rounded-md text-[#332a21] outline-none focus:border-[#c5a880]"
                    placeholder="En una frase..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7d6f5e] mb-2">Nivel de ánimo (1-5)</label>
                  <input 
                    type="range" 
                    min="1" max="5" 
                    value={moodLevel} 
                    onChange={e => setMoodLevel(Number(e.target.value))}
                    className="w-full accent-[#8c7350]"
                  />
                  <div className="flex justify-between text-[10px] text-[#7d6f5e] font-bold mt-1">
                    <span>1 (Bajo)</span>
                    <span>3 (Neutral)</span>
                    <span>5 (Alto)</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="mt-2 bg-[#211912] text-[#f7f1df] py-3 rounded-md font-serif tracking-wider uppercase text-sm hover:bg-[#332a21] transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Sellar Reflexión en la Bitácora"}
                </button>
              </form>
            </div>
          </div>
        )}

        {carta.hasReflection && (
          <div className="w-full text-center mt-4 bg-[rgba(255,255,255,0.03)] border border-green-900/30 rounded-xl p-6">
            <span className="text-3xl mb-3 block">✨</span>
            <h3 className="text-xl font-serif text-[var(--gold)] mb-2">Reflexión Guardada</h3>
            <p className="text-[var(--text-muted)] text-sm">Has completado tu registro de hoy. Puedes revisar estas reflexiones históricas o continuar con tu diario energético actual.</p>
            <button onClick={() => router.push("/reflexiones-carta-dia")} className="mt-4 px-6 py-2 bg-[rgba(201,166,107,0.1)] border border-[rgba(201,166,107,0.3)] rounded-lg text-sm text-[var(--gold-bright)] hover:bg-[rgba(201,166,107,0.2)] transition-colors">
              Ver historial energético
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
