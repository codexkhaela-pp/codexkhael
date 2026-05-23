const fs = require('fs');

const code = fs.readFileSync('src/data/tarotCards.ts', 'utf8');
const slugs = [];
const regex = /"slug":\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(code)) !== null) {
  slugs.push(match[1]);
}

const idSet = new Set();
['arcanos_mayores_modal_data_PRO_FINAL_v2.json', 'arcanos_menores_copas_modal_data_PRO_FINAL_v1.json', 'arcanos_menores_oros_modal_data_PRO_FINAL_v1.json', 'arcanos_menores_bastos_modal_data_PRO_FINAL_v1.json', 'arcanos_menores_espadas_modal_data_PRO_FINAL_v1.json'].forEach(f => {
  const data = JSON.parse(fs.readFileSync('src/data/' + f, 'utf8'));
  data.cartas.forEach(c => idSet.add(c.id));
});

console.log("Total slugs:", slugs.length);
console.log("Total JSON IDs:", idSet.size);

const unmapped = [];
slugs.forEach(slug => {
  const normalized = slug.replace(/_/g, '-');
  if (!idSet.has(normalized)) {
    unmapped.push({slug, normalized});
  }
});

console.log("Unmapped count:", unmapped.length);
if (unmapped.length > 0) {
  console.log("Example unmapped:", unmapped.slice(0, 5));
}
