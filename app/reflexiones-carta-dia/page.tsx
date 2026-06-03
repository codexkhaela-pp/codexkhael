import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { tarotCards } from "@/src/data/tarotCards";

export default async function ReflexionesCartaDiaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/reflexiones-carta-dia");
  }

  const reflexiones = await prisma.reflexionCartaDia.findMany({
    where: { userId: user.id },
    include: { cartaDelDia: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen text-[#eadebe]">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-serif text-[var(--gold-bright)] mb-2">Historial Energético</h1>
        <p className="text-sm text-[var(--text-muted)] tracking-wider uppercase">Reflexiones históricas de Carta del Día</p>
      </header>

      {reflexiones.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)] border border-dashed border-[rgba(201,166,107,0.2)] rounded-xl">
          <p>Aún no tienes reflexiones históricas guardadas.</p>
          <a href="/carta-del-dia" className="mt-4 inline-block text-[var(--gold)] hover:underline">Ir a tu Carta del Día</a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {reflexiones.map((entry) => {
            const cardData = tarotCards.find((card) => card.id === entry.cartaDelDia.cardId);
            return (
              <div key={entry.id} className="bg-[#18142c] border border-[rgba(201,166,107,0.2)] rounded-xl overflow-hidden flex flex-col md:flex-row shadow-lg">
                <div className="md:w-1/4 bg-[#0e0d19] p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[rgba(201,166,107,0.2)]">
                  <div className="relative w-24 aspect-[0.57] rounded-md overflow-hidden mb-3 border border-[rgba(201,166,107,0.3)]">
                    {cardData ? (
                      <Image
                        src={cardData.image}
                        alt={cardData.nameEs}
                        fill
                        className={`object-cover ${entry.cartaDelDia.orientation === "REVERSED" ? "rotate-180" : ""}`}
                      />
                    ) : null}
                  </div>
                  <h4 className="font-serif text-[var(--gold)] text-center text-sm">
                    {cardData?.nameEs}
                    {entry.cartaDelDia.orientation === "REVERSED" ? <span className="block text-[10px] opacity-70">(Invertida)</span> : null}
                  </h4>
                  <span className="text-xs text-[var(--text-muted)] mt-1 font-mono">{entry.cartaDelDia.fechaLocal}</span>
                </div>

                <div className="md:w-3/4 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-serif text-white mb-1">Reflexión nocturna</h3>
                      <span className="text-xs text-[var(--gold)] border border-[var(--gold)] px-2 py-1 rounded-full uppercase tracking-wider">
                        Energía: {entry.sintioEnergia}
                      </span>
                      <span className="text-xs text-gray-400 ml-2 border border-gray-700 px-2 py-1 rounded-full uppercase tracking-wider">
                        Ánimo: {entry.moodLevel}/5
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#110f1f] p-4 rounded-lg mb-4 border-l-2 border-[#332a21]">
                    <p className="text-[var(--text-light)] italic">"{entry.textoReflexion}"</p>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#7d6f5e] mb-1">Mayor aprendizaje</h5>
                    <p className="text-sm text-[#e0d9cd]">{entry.aprendizaje}</p>
                  </div>

                  {entry.analisisCoincidencia ? (
                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--gold-bright)] mb-2">Coincidencia energética (PRO)</h5>
                      <p className="text-sm text-[#eadebe]">{entry.analisisCoincidencia}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
