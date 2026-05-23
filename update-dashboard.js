const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'app/tiradas/spread-reader.tsx',
  'app/progreso/page.tsx',
  'app/planes/page.tsx',
  'app/page.tsx',
  'app/components/internal-nav.tsx',
  'app/components/back-button.tsx'
];

files.forEach(f => {
  const filepath = path.join('d:/FUENTES - CODIGO/3. PROPIOS/codexkhael/codexkhael', f);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    content = content.replace(/"\/dashboard"/g, '"/dashboard-preview"');
    content = content.replace(/'\/dashboard'/g, "'/dashboard-preview'");
    fs.writeFileSync(filepath, content);
    console.log("Updated", f);
  }
});
