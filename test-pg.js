const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM "ClientReading" ORDER BY "createdAt" DESC LIMIT 1');
  const reading = res.rows[0];
  console.log(`Reading: ${reading.title} (Canvas: ${reading.canvasWidth}x${reading.canvasHeight})`);
  
  const cardsRes = await client.query('SELECT * FROM "ClientReadingCard" WHERE "readingId" = $1 ORDER BY "positionIndex" ASC', [reading.id]);
  for (const c of cardsRes.rows) {
    console.log(`- ${c.cardName} (${c.positionName}): x=${c.x}, y=${c.y}, rot=${c.rotation}, scale=${c.relativeScale}`);
  }
  
  await client.end();
}

main().catch(console.error);
