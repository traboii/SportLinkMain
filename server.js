const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const USERS_FILE = path.join(ROOT, ".data", "users.json");
const sessions = new Map();
const MIME_TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };
async function readUsers() { try { return JSON.parse(await fs.promises.readFile(USERS_FILE, "utf8")); } catch (e) { if (e.code === "ENOENT") return []; throw e; } }
async function saveUsers(users) { await fs.promises.mkdir(path.dirname(USERS_FILE), { recursive: true }); const tmp = `${USERS_FILE}.${process.pid}.tmp`; await fs.promises.writeFile(tmp, JSON.stringify(users, null, 2), { mode: 0o600 }); await fs.promises.rename(tmp, USERS_FILE); }
function json(res, status, data, headers = {}) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }); res.end(JSON.stringify(data)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ""; req.on("data", chunk => { raw += chunk; if (raw.length > 16384) { reject(Error("Request too large")); req.destroy(); } }); req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(Error("Invalid JSON")); } }); req.on("error", reject); }); }
function cookie(req) { const entry = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith("sportlink_session=")); return entry ? decodeURIComponent(entry.slice(18)) : ""; }
function setSession(res, user) { const id = crypto.randomBytes(32).toString("hex"); sessions.set(id, { userId: user.id, expires: Date.now() + 604800000 }); res.setHeader("Set-Cookie", `sportlink_session=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`); }
function publicUser(u) { return { id: u.id, email: u.email, name: u.name, provider: u.provider }; }
function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) { return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") }; }
function validPassword(password, user) { const a = Buffer.from(passwordHash(password, user.salt).hash, "hex"); const b = Buffer.from(user.passwordHash, "hex"); return a.length === b.length && crypto.timingSafeEqual(a, b); }
async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/config") return json(res, 200, { googleClientId: process.env.GOOGLE_CLIENT_ID || "" });
  if (req.method === "GET" && url.pathname === "/api/session") { const id = cookie(req), session = sessions.get(id); if (!session || session.expires < Date.now()) { sessions.delete(id); return json(res, 200, { user: null }); } const user = (await readUsers()).find(u => u.id === session.userId); return json(res, 200, { user: user ? publicUser(user) : null }); }
  if (req.method === "POST" && url.pathname === "/api/logout") { sessions.delete(cookie(req)); return json(res, 200, { ok: true }, { "Set-Cookie": "sportlink_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" }); }
  if (req.method !== "POST" || !["/api/register", "/api/login", "/api/google"].includes(url.pathname)) return json(res, 404, { error: "Not found" });
  let data; try { data = await body(req); } catch (e) { return json(res, 400, { error: e.message }); }
  const users = await readUsers();
  if (url.pathname === "/api/register") {
    const email = String(data.email || "").trim().toLowerCase(), password = String(data.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "Enter a valid email address." });
    if (password.length < 8 || password.length > 256) return json(res, 400, { error: "Password must be at least 8 characters." });
    if (users.some(u => u.email === email)) return json(res, 409, { error: "An account with that email already exists. Try logging in." });
    const credentials = passwordHash(password), user = { id: crypto.randomUUID(), email, name: email.split("@")[0], provider: "password", salt: credentials.salt, passwordHash: credentials.hash };
    users.push(user); await saveUsers(users); setSession(res, user); return json(res, 201, { user: publicUser(user) });
  }
  if (url.pathname === "/api/login") {
    const email = String(data.email || "").trim().toLowerCase(), user = users.find(u => u.email === email && u.passwordHash);
    if (!user || !validPassword(String(data.password || ""), user)) return json(res, 401, { error: "Email or password is incorrect." });
    setSession(res, user); return json(res, 200, { user: publicUser(user) });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return json(res, 503, { error: "Google sign-in is not configured yet." });
  if (!data.credential) return json(res, 400, { error: "Google did not return a sign-in credential." });
  try {
    const verified = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(data.credential)}`);
    if (!verified.ok) return json(res, 401, { error: "Google sign-in could not be verified." });
    const claims = await verified.json();
    if (claims.aud !== clientId || claims.email_verified !== "true" || !claims.sub || !claims.email) return json(res, 401, { error: "Google account verification failed." });
    let user = users.find(u => u.googleId === claims.sub || u.email === claims.email.toLowerCase());
    if (!user) { user = { id: crypto.randomUUID(), email: claims.email.toLowerCase(), name: claims.name || claims.email.split("@")[0], provider: "google", googleId: claims.sub }; users.push(user); }
    else if (!user.googleId) { user.googleId = claims.sub; user.name = claims.name || user.name; }
    await saveUsers(users); setSession(res, user); return json(res, 200, { user: publicUser(user) });
  } catch (e) { console.error("Google sign-in verification failed:", e.message); return json(res, 502, { error: "Could not reach Google to verify sign-in. Try again." }); }
}
const server = http.createServer(async (req, res) => {
  let url; try { url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`); } catch { res.writeHead(400); return res.end("Bad request"); }
  if (url.pathname.startsWith("/api/")) { try { return await handleApi(req, res, url); } catch (e) { console.error(e); return json(res, 500, { error: "Server error. Please try again." }); } }
  let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end("Bad request"); }
  if (pathname.split("/").some(part => part.startsWith("."))) { res.writeHead(404); return res.end("Not found"); }
  const file = path.resolve(ROOT, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(file, (err, stats) => { if (err || !stats.isFile()) { res.writeHead(404); return res.end("Not found"); } res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" }); fs.createReadStream(file).pipe(res); });
});
server.listen(PORT, HOST, () => console.log(`SportLink is running at http://${HOST}:${PORT}`));
