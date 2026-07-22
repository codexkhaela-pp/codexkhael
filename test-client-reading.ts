import { PrismaClient } from "./src/generated/prisma";
import * as fs from "fs";

async function main() {
  const prisma = new PrismaClient();
  
  // Find any client reading
  const reading = await prisma.clientReading.findFirst({
    include: {
      cards: true,
      sections: true,
      client: true
    }
  });

  if (!reading) {
    console.log("No client reading found in DB to test!");
    process.exit(0);
  }

  console.log(`Found reading: ${reading.title}, testing via direct call to generation...`);
  
  // We can just hit the API or call the same logic
  // Let's call the API via fetch to localhost:3000
  try {
    const res = await fetch(`http://localhost:3000/api/mis-lecturas/${reading.id}/export`);
    if (!res.ok) {
      console.error("Export failed:", await res.text());
      return;
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync("test_lectura_cliente.pdf", Buffer.from(buffer));
    console.log("Saved test_lectura_cliente.pdf");
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

main();
