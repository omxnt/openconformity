/**
 * The beta gate: HTTP Basic Authentication in front of the software at
 * app.openconformity.org, one shared login for the testers. Runs as a
 * Cloudflare Worker on the route `app.openconformity.org/*` and passes an
 * authorised request through to the Pages deployment untouched. Not part
 * of the software, which is static files and knows nothing of this. The
 * login comes from the Worker's variables, BETA_USER and BETA_PASSWORD,
 * and the gate fails closed while either is unset.
 */

const REALM = 'openconformity beta';
const encoder = new TextEncoder();

/** Whether two strings are equal, compared in constant time for equal lengths. */
function same(a, b) {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  if (x.byteLength !== y.byteLength) return false;
  return crypto.subtle.timingSafeEqual(x, y);
}

/** The user and password of a Basic Authorization header, or null. */
function credentials(header) {
  if (!header) return null;
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  let decoded;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const at = decoded.indexOf(':');
  if (at < 0) return null;
  return { user: decoded.slice(0, at), pass: decoded.slice(at + 1) };
}

/** The page behind a declined prompt. Self-contained, since everything on the host sits behind the gate. */
const CLOSED = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>openconformity</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px/1.5 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; background: #f4f4f4; color: #161616; }
  @media (prefers-color-scheme: dark) { body { background: #161616; color: #f4f4f4; } }
  main { max-width: 32rem; padding: 2rem; }
  h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
  p { margin: 0 0 0.5rem; }
  a { color: inherit; }
</style>
</head>
<body>
<main>
  <h1>openconformity is in private beta</h1>
  <p>The tool is open to invited testers. Reload the page to sign in with the login from your invitation.</p>
  <p><a href="https://openconformity.org">About the project</a></p>
</main>
</body>
</html>
`;

export default {
  async fetch(request, env) {
    const given = credentials(request.headers.get('Authorization'));
    const configured = typeof env.BETA_USER === 'string' && typeof env.BETA_PASSWORD === 'string';
    if (configured && given && same(given.user, env.BETA_USER) && same(given.pass, env.BETA_PASSWORD)) {
      return fetch(request);
    }
    return new Response(CLOSED, {
      status: 401,
      headers: {
        'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  },
};
