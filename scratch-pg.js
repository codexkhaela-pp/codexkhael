const { Client } = require('pg');
require('dotenv').config();

// Fix up the prisma+postgres URL to a standard postgres URL for pg package
let dbUrl = process.env.DATABASE_URL;
if (dbUrl.startsWith("prisma+postgres")) {
  // extract base url from shadow url or something?
  // Actually, we can just use Prisma directly in a Next.js API route!
}

// Next API route is easier and I can use curl if I bypass auth!
