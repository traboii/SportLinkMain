const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline/promises");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "335963324849-hk9le3koh3d76i6e3oog15gcu1a72l96.apps.googleusercontent.com";
const ROOT = __dirname;
const USERS_FILE = path.join(ROOT, ".data", "users.json");
const NEWS_FILE = path.join(ROOT, ".data", "news.json");
const MAP_LOCATIONS_FILE = path.join(ROOT, ".data", "map-locations.json");
const EVENTS_FILE = path.join(ROOT, ".data", "events.json");
const TEAMS_FILE = path.join(ROOT, ".data", "teams.json");
const DEFAULT_TEAMS = [
  ["CCS HIPHOP DANCERS","A passionate dance crew that showcases creativity, teamwork, and energy through every performance.","Others"],
  ["CCS Phoenixes Esports","A competitive gaming team that combines strategy, communication, and teamwork to take on every challenge.","E-sports"],
  ["CCS BASKETBALL TEAM","A dedicated team that brings skill, determination, and teamwork to every game on the court.","Basketball"],
  ["CCS VOLLEYBALL TEAM","A team built on trust, coordination, and sportsmanship, working together toward every point.","Volleyball"],
  ["CCS TAEKWONDO TEAM","A group of martial artists developing discipline, confidence, and focus through training and competition.","Others"],
  ["CCS BADMINTON TEAM","Quick reflexes and smart strategies drive this team as its players challenge themselves on the court.","Others"],
  ["CCS MOBILE LEGENDS SQUAD","A squad focused on tactical plays, team coordination, and making smart decisions in every match.","E-sports"],
  ["CCS Chess Club","A community of strategic thinkers sharpening their minds through friendly matches and competitive play.","Others"],
  ["CCS PHOENIX PEP SQUAD","An energetic group that brings school spirit, excitement, and support to campus sports events.","Others"]
].map((team,i)=>({id:`team-${i+1}`,name:team[0],summary:team[1],category:team[2],overview:`${team[1]} The team proudly represents the College of Computer Studies (CCS), carrying the spirit and determination of our school in every game.`,placement:"1st Runner Up",playerCount:"12 Players",cover:"assets/ccs-banner-crowd.png",players:[{name:"Klent Josh Vargas",number:"9",position:"Open Hitter",image:"assets/ccs-phoenix-banner.png"},{name:"Kairo Eclarinal",number:"9",position:"Middle Blocker",image:"assets/ccs-phoenix-banner.png"},{name:"Zandro Papa",number:"9",position:"Middle Blocker",image:"assets/ccs-phoenix-banner.png"},{name:"John Lloyd Cruz",number:"9",position:"Open Hitter",image:"assets/ccs-phoenix-banner.png"},{name:"Vishu Mariano",number:"9",position:"Libero",image:"assets/ccs-phoenix-banner.png"}],joinBackground:"assets/team-join-banner.png",tryoutLink:""}));
const DEFAULT_TEAM_PAGE = { title: "EXPLORE OUR TEAMS.", subtitle: "Check out these incredible CCS athletes!" };
const sessions = new Map();
const MIME_TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };
async function readUsers() { try { return JSON.parse(await fs.promises.readFile(USERS_FILE, "utf8")); } catch (e) { if (e.code === "ENOENT") return []; throw e; } }
async function saveUsers(users) { await fs.promises.mkdir(path.dirname(USERS_FILE), { recursive: true }); const tmp = `${USERS_FILE}.${process.pid}.tmp`; await fs.promises.writeFile(tmp, JSON.stringify(users, null, 2), { mode: 0o600 }); await fs.promises.rename(tmp, USERS_FILE); }
function json(res, status, data, headers = {}) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }); res.end(JSON.stringify(data)); }
function body(req, limit = 16384) { return new Promise((resolve, reject) => { let raw = ""; req.on("data", chunk => { raw += chunk; if (raw.length > limit) { reject(Error("Request too large")); req.destroy(); } }); req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(Error("Invalid JSON")); } }); req.on("error", reject); }); }
function cookie(req) { const entry = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith("sportlink_session=")); return entry ? decodeURIComponent(entry.slice(18)) : ""; }
function setSession(res, user) { const id = crypto.randomBytes(32).toString("hex"); sessions.set(id, { userId: user.id, expires: Date.now() + 604800000 }); res.setHeader("Set-Cookie", `sportlink_session=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`); }
function publicUser(u) { return { id: u.id, email: u.email, name: u.name, provider: u.provider }; }
function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) { return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") }; }
function validPassword(password, user) { const a = Buffer.from(passwordHash(password, user.salt).hash, "hex"); const b = Buffer.from(user.passwordHash, "hex"); return a.length === b.length && crypto.timingSafeEqual(a, b); }
async function createAdminFromTerminal() {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = (await terminal.question("Admin email: ")).trim().toLowerCase();
    const password = await terminal.question("Admin password (minimum 8 characters): ");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 256) throw new Error("Enter a valid email and a password between 8 and 256 characters.");
    const users = await readUsers();
    const existing = users.find(user => user.email === email);
    if (existing) {
      if (existing.role === "admin") throw new Error("That admin account already exists.");
      throw new Error("That email already belongs to a client account. Choose a different email.");
    }
    const credentials = passwordHash(password);
    users.push({ id: crypto.randomUUID(), email, name: "SportLink Admin", provider: "password", role: "admin", salt: credentials.salt, passwordHash: credentials.hash });
    await saveUsers(users);
    console.log(`Admin account created for ${email}. Visit http://${HOST}:${PORT}/admin`);
  } finally { terminal.close(); }
}
async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/teams") { try { return json(res,200,JSON.parse(await fs.promises.readFile(TEAMS_FILE,"utf8"))); } catch(e) { if(e.code==="ENOENT") return json(res,200,{teams:DEFAULT_TEAMS,page:DEFAULT_TEAM_PAGE}); throw e; } }
  if ((req.method === "GET" || req.method === "PUT") && url.pathname === "/api/admin/teams") {
    const session=sessions.get(cookie(req)); if(!session||session.expires<Date.now()) return json(res,401,{error:"Please log in again."});
    const users=await readUsers(); if(!users.some(user=>user.id===session.userId&&user.role==="admin")) return json(res,403,{error:"Admin access required."});
    if(req.method==="GET"){try{return json(res,200,JSON.parse(await fs.promises.readFile(TEAMS_FILE,"utf8")))}catch(e){if(e.code==="ENOENT")return json(res,200,{teams:DEFAULT_TEAMS,page:DEFAULT_TEAM_PAGE});throw e}}
    let data;try{data=await body(req,12*1024*1024)}catch(e){return json(res,400,{error:e.message})}
    if(!Array.isArray(data.teams)||data.teams.length>30)return json(res,400,{error:"Teams must contain up to 30 entries."});
    const plain=value=>String(value||"").trim().slice(0,12000),image=value=>{const src=String(value||"");return src.length<5*1024*1024&&(/^(assets\/[\w./-]+|data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+)$/i.test(src))?src:""};
    const teams=data.teams.map((team,index)=>({id:String(team.id||`team-${index+1}`).replace(/[^\w-]/g,"").slice(0,48),name:plain(team.name).slice(0,120),category:plain(team.category).slice(0,60)||"Others",summary:plain(team.summary).slice(0,500),overview:plain(team.overview),placement:plain(team.placement).slice(0,120),playerCount:plain(team.playerCount).slice(0,40),cover:image(team.cover),players:Array.isArray(team.players)?team.players.slice(0,40).map((player,i)=>({id:String(player.id||`player-${i+1}`).replace(/[^\w-]/g,"").slice(0,48),name:plain(player.name).slice(0,120),number:plain(player.number).slice(0,12),position:plain(player.position).slice(0,80),image:image(player.image)})).filter(player=>player.name):[],joinBackground:image(team.joinBackground),tryoutLink:/^https?:\/\/\S+$/i.test(String(team.tryoutLink||""))?plain(team.tryoutLink).slice(0,1000):""}));
    if(teams.some(team=>!team.name))return json(res,400,{error:"Every team needs a name."});
    const page={title:plain(data.page?.title||DEFAULT_TEAM_PAGE.title).slice(0,100),subtitle:plain(data.page?.subtitle||DEFAULT_TEAM_PAGE.subtitle).slice(0,220)};
    await fs.promises.mkdir(path.dirname(TEAMS_FILE),{recursive:true});const tmp=`${TEAMS_FILE}.${process.pid}.tmp`;await fs.promises.writeFile(tmp,JSON.stringify({teams,page},null,2));await fs.promises.rename(tmp,TEAMS_FILE);return json(res,200,{teams,page});
  }
  if (req.method === "GET" && url.pathname === "/api/events") { try { return json(res,200,JSON.parse(await fs.promises.readFile(EVENTS_FILE,"utf8"))); } catch(e) { if(e.code==="ENOENT") return json(res,200,{events:[]}); throw e; } }
  if ((req.method === "GET" || req.method === "PUT") && url.pathname === "/api/admin/events") { const session=sessions.get(cookie(req));if(!session||session.expires<Date.now())return json(res,401,{error:"Please log in again."});const users=await readUsers();if(!users.some(u=>u.id===session.userId&&u.role==="admin"))return json(res,403,{error:"Admin access required."});if(req.method==="GET"){try{return json(res,200,JSON.parse(await fs.promises.readFile(EVENTS_FILE,"utf8")))}catch(e){if(e.code==="ENOENT")return json(res,200,{events:[]});throw e}}let data;try{data=await body(req,12*1024*1024)}catch(e){return json(res,400,{error:e.message})}if(!Array.isArray(data.events))return json(res,400,{error:"Invalid events."});await fs.promises.mkdir(path.dirname(EVENTS_FILE),{recursive:true});await fs.promises.writeFile(EVENTS_FILE,JSON.stringify({events:data.events},null,2));return json(res,200,{events:data.events}); }
  if (req.method === "GET" && url.pathname === "/api/map-locations") { try { return json(res,200,JSON.parse(await fs.promises.readFile(MAP_LOCATIONS_FILE,"utf8"))); } catch(e) { if(e.code==="ENOENT") return json(res,200,{locations:[]}); throw e; } }
  if ((req.method === "GET" || req.method === "PUT") && url.pathname === "/api/admin/map-locations") {
    const session=sessions.get(cookie(req)); if(!session||session.expires<Date.now()) return json(res,401,{error:"Please log in again."});
    const users=await readUsers(), admin=users.find(user=>user.id===session.userId&&user.role==="admin"); if(!admin) return json(res,403,{error:"Admin access required."});
    if(req.method==="GET"){try{return json(res,200,JSON.parse(await fs.promises.readFile(MAP_LOCATIONS_FILE,"utf8")));}catch(e){if(e.code==="ENOENT")return json(res,200,{locations:[]});throw e;}}
    let data;try{data=await body(req,1024*1024)}catch(e){return json(res,400,{error:e.message})} if(!Array.isArray(data.locations)||data.locations.length>500)return json(res,400,{error:"Invalid map locations."});
    const locations=data.locations.map(p=>({id:String(p.id||crypto.randomUUID()).slice(0,80),name:String(p.name||"").trim().slice(0,120),sport:String(p.sport||"Others").slice(0,40),division:String(p.division||"Open").slice(0,40),address:String(p.address||"").slice(0,240),info:String(p.info||"").slice(0,2000),lat:Number(p.lat),lng:Number(p.lng)})).filter(p=>p.name&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180);
    await fs.promises.mkdir(path.dirname(MAP_LOCATIONS_FILE),{recursive:true});await fs.promises.writeFile(MAP_LOCATIONS_FILE,JSON.stringify({locations},null,2));return json(res,200,{locations});
  }
  if (req.method === "GET" && url.pathname === "/api/news") { try { return json(res, 200, JSON.parse(await fs.promises.readFile(NEWS_FILE, "utf8"))); } catch (e) { if (e.code === "ENOENT") return json(res, 200, { stories: [] }); throw e; } }
  if (req.method === "GET" && url.pathname === "/api/config") return json(res, 200, { googleClientId: GOOGLE_CLIENT_ID });
  if (req.method === "GET" && url.pathname === "/api/session") { const id = cookie(req), session = sessions.get(id); if (!session || session.expires < Date.now()) { sessions.delete(id); return json(res, 200, { user: null }); } const user = (await readUsers()).find(u => u.id === session.userId); return json(res, 200, { user: user ? { ...publicUser(user), role: user.role || "client" } : null }); }
  if (req.method === "POST" && url.pathname === "/api/admin/login") {
    let data; try { data = await body(req); } catch (e) { return json(res, 400, { error: e.message }); }
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    if (!email || !password) return json(res, 400, { error: "Enter both email and password." });
    const user = (await readUsers()).find(entry => entry.email === email && entry.role === "admin" && entry.passwordHash);
    if (!user || !validPassword(password, user)) return json(res, 401, { error: "Admin email or password is incorrect." });
    setSession(res, user); return json(res, 200, { user: { ...publicUser(user), role: "admin" } });
  }
  if (req.method === "GET" && url.pathname === "/api/admin/users") {
    const session = sessions.get(cookie(req));
    if (!session || session.expires < Date.now()) return json(res, 401, { error: "Please log in again." });
    const users = await readUsers(), admin = users.find(user => user.id === session.userId && user.role === "admin");
    if (!admin) return json(res, 403, { error: "Admin access required." });
    const clients = users.filter(user => user.role !== "admin").map(user => ({ ...publicUser(user), role: "client" }));
    return json(res, 200, { users: clients, total: clients.length });
  }
  if ((req.method === "GET" || req.method === "PUT") && url.pathname === "/api/admin/news") {
    const session = sessions.get(cookie(req));
    if (!session || session.expires < Date.now()) return json(res, 401, { error: "Please log in again." });
    const users = await readUsers(), admin = users.find(user => user.id === session.userId && user.role === "admin");
    if (!admin) return json(res, 403, { error: "Admin access required." });
    if (req.method === "GET") { try { return json(res, 200, JSON.parse(await fs.promises.readFile(NEWS_FILE, "utf8"))); } catch (e) { if (e.code === "ENOENT") return json(res, 200, { stories: [] }); throw e; } }
    let data; try { data = await body(req, 12 * 1024 * 1024); } catch (e) { return json(res, 400, { error: e.message }); }
    if (!Array.isArray(data.stories) || data.stories.length > 30) return json(res, 400, { error: "News content must contain up to 30 stories." });
    const normalized = data.stories.map((story, index) => {
      const text = value => String(value || "").trim().slice(0, 12000);
      const validImage = value => { const image = String(value || ""); return image.length < 5 * 1024 * 1024 && (/^(assets\/[\w./-]+|data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+)$/i.test(image)) ? image : ""; };
      return { id: String(story.id || `story-${index + 1}`).replace(/[^\w-]/g, "").slice(0, 48), title: text(story.title), tag: text(story.tag), text: text(story.text), articleTitle: text(story.articleTitle), date: text(story.date), author: text(story.author), paragraph: text(story.paragraph), paragraph2: text(story.paragraph2), image: validImage(story.image), heroImage: validImage(story.heroImage), gallery: Array.isArray(story.gallery) ? story.gallery.slice(0, 8).map(validImage) : [] };
    });
    if (normalized.some(story => !story.title || !story.articleTitle)) return json(res, 400, { error: "Every story needs a card title and article title." });
    await fs.promises.mkdir(path.dirname(NEWS_FILE), { recursive: true });
    const tmp = `${NEWS_FILE}.${process.pid}.tmp`; await fs.promises.writeFile(tmp, JSON.stringify({ stories: normalized }, null, 2)); await fs.promises.rename(tmp, NEWS_FILE);
    return json(res, 200, { stories: normalized });
  }
  if (req.method === "POST" && url.pathname === "/api/logout") { sessions.delete(cookie(req)); return json(res, 200, { ok: true }, { "Set-Cookie": "sportlink_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" }); }
  if (req.method !== "POST" || !["/api/register", "/api/login", "/api/google"].includes(url.pathname)) return json(res, 404, { error: "Not found" });
  let data; try { data = await body(req); } catch (e) { return json(res, 400, { error: e.message }); }
  const users = await readUsers();
  if (url.pathname === "/api/register") {
    const email = String(data.email || "").trim().toLowerCase(), password = String(data.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "Enter a valid email address." });
    if (password.length < 8 || password.length > 256) return json(res, 400, { error: "Password must be at least 8 characters." });
    if (users.some(u => u.email === email)) return json(res, 409, { error: "An account with that email already exists. Try logging in." });
    const credentials = passwordHash(password), user = { id: crypto.randomUUID(), email, name: email.split("@")[0], provider: "password", role: "client", salt: credentials.salt, passwordHash: credentials.hash };
    users.push(user); await saveUsers(users); setSession(res, user); return json(res, 201, { user: { ...publicUser(user), role: "client" } });
  }
  if (url.pathname === "/api/login") {
    const email = String(data.email || "").trim().toLowerCase(), password = String(data.password || "");
    if (!email || !password) return json(res, 400, { error: "Enter both email and password." });
    const user = users.find(u => u.email === email && u.passwordHash);
    if (!user || !validPassword(password, user)) return json(res, 401, { error: "Email or password is incorrect." });
    setSession(res, user); return json(res, 200, { user: { ...publicUser(user), role: user.role || "client" } });
  }
  const clientId = GOOGLE_CLIENT_ID;
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
    await saveUsers(users); setSession(res, user); return json(res, 200, { user: { ...publicUser(user), role: user.role || "client" } });
  } catch (e) { console.error("Google sign-in verification failed:", e.message); return json(res, 502, { error: "Could not reach Google to verify sign-in. Try again." }); }
}
if (process.argv.includes("--create-admin")) {
  createAdminFromTerminal().catch(error => { console.error(error.message); process.exitCode = 1; });
} else {
const server = http.createServer(async (req, res) => {
  let url; try { url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`); } catch { res.writeHead(400); return res.end("Bad request"); }
  if (url.pathname.startsWith("/api/")) { try { return await handleApi(req, res, url); } catch (e) { console.error(e); return json(res, 500, { error: "Server error. Please try again." }); } }
  let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end("Bad request"); }
  if (pathname.split("/").some(part => part.startsWith("."))) { res.writeHead(404); return res.end("Not found"); }
  if (pathname === "/admin") pathname = "/admin.html";
  const file = path.resolve(ROOT, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(file, (err, stats) => { if (err || !stats.isFile()) { res.writeHead(404); return res.end("Not found"); } res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" }); fs.createReadStream(file).pipe(res); });
});
server.listen(PORT, HOST, () => console.log(`SportLink is running at http://${HOST}:${PORT}`));
}
