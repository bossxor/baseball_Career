/** Android/production client must use HTTPS API — never localhost / 127.0.0.1 / plain http. */
const raw = process.env.VITE_API_BASE?.trim();
if (!raw) {
  console.error('VITE_API_BASE is required for Android builds (https://your-api-host).');
  process.exit(1);
}
let url;
try {
  url = new URL(raw);
} catch {
  console.error(`VITE_API_BASE is not a valid URL: ${raw}`);
  process.exit(1);
}
if (url.protocol !== 'https:') {
  console.error(`VITE_API_BASE must be https (got ${url.protocol})`);
  process.exit(1);
}
const host = url.hostname.toLowerCase();
if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
  console.error(`VITE_API_BASE must not be a local host (got ${host})`);
  process.exit(1);
}
console.log(`OK Android API base: ${url.origin}`);
