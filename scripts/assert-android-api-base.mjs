/** Android/production client must use an HTTPS API on a public host — never loopback, private, link-local or plain http. */
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

/** IPv4 dotted quad → octets, else null. */
function ipv4(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  return m && m.slice(1).every(n => Number(n) <= 255) ? m.slice(1).map(Number) : null;
}
export function isLocalOrPrivateHost(rawHost) {
  const host = rawHost.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return true;
  const v4 = ipv4(host);
  if (v4) {
    const [a, b] = v4;
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (host.includes(':')) {
    // IPv6: unspecified, loopback, unique-local fc00::/7, link-local fe80::/10, IPv4-mapped.
    if (host === '::' || host === '::1' || /^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true;
    // URL() writes IPv4-mapped addresses in hex (::ffff:7f00:1); convert back before judging.
    const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
    if (hex) { const hi = parseInt(hex[1], 16), lo = parseInt(hex[2], 16); return isLocalOrPrivateHost(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`); }
    const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(host);
    return dotted ? isLocalOrPrivateHost(dotted[1]) : false;
  }
  return !host.includes('.');
}
if (isLocalOrPrivateHost(url.hostname)) {
  console.error(`VITE_API_BASE must be a public host (got ${url.hostname})`);
  process.exit(1);
}
console.log(`OK Android API base: ${url.origin}`);
