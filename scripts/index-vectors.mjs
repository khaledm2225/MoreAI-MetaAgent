// Sends the catalog's descriptions to the Worker, which embeds and stores them. Needs ADMIN_TOKEN and API_URL.
import { readFileSync } from 'node:fs';

const items = JSON.parse(readFileSync('apps/api/seed/vectors.json', 'utf8'));
const BATCH = 25;
for (let start = 0; start < items.length; start += BATCH) {
  const response = await fetch(`${process.env.API_URL}/api/admin/index-vectors`, {
    method: 'POST',
    headers: { 'x-admin-token': process.env.ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items.slice(start, start + BATCH) }),
  });
  console.log(start, response.status, (await response.text()).slice(0, 120));
}
