export async function fetchTarotModalData(id: string, simulatePlan?: string) {
  const url = new URL(`/api/tarot/modal/${id}`, window.location.origin);
  if (simulatePlan) {
    url.searchParams.set("simulatePlan", simulatePlan);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Error fetching tarot modal data");
  }
  return res.json();
}
