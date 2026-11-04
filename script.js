const authCard = document.querySelector("#auth-card");
const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const modeButton = document.querySelector("#mode-button");
const landingPage = document.querySelector("#landing-page");
let registering = false;

let stories = [
  { image: "assets/sportlink-background.jpg", title: "CCS: Hip-hop dancers team take 2nd runner up", tag: "DANCE", text: "The beat dropped. The energy exploded. And CCS stepped up! Our dancers brought the spirit to the floor." },
  { image: "assets/ccs-banner-crowd.png", title: "Ka-Phoenix represent at the campus games", tag: "CAMPUS LIFE", text: "A proud day for our CCS community. Meet the students who showed up, cheered loud, and made every moment count." },
  { image: "assets/ccs-banner-crowd.png", title: "One team, one crowd, one unforgettable day", tag: "COMMUNITY", text: "From the first whistle to the final photo, CCS came together to celebrate sport, friendship, and school spirit." },
  { image: "assets/ccs-campus-background.png", title: "The best moments from this season", tag: "HIGHLIGHTS", text: "A look back at the plays, the teamwork, and the memories that made this season one to remember." },
  { image: "assets/ccs-banner-crowd.png", title: "CCS athletes bring the heat at the games", tag: "ATHLETICS", text: "Our Ka-Phoenix brought focus, heart, and determination to every match. Congratulations to all our competitors." },
  { image: "assets/ccs-banner-crowd.png", title: "Celebrating the people behind the plays", tag: "COMMUNITY", text: "Coaches, volunteers, and supporters make every game day special. This win belongs to the whole CCS family." },
  { image: "assets/ccs-campus-background.png", title: "Game day: the CCS spirit in full force", tag: "GAME DAY", text: "The sidelines were full, the energy was high, and our community showed what it means to stand together." },
  { image: "assets/ccs-banner-crowd.png", title: "A season powered by teamwork", tag: "TEAMS", text: "Every practice and every point brought us closer. Here are a few moments worth celebrating again." },
];

function showUser(user) {
  authCard.hidden = true;
  landingPage.hidden = false;
  document.body.classList.add("landing-mode");
  document.querySelector("#account-email").textContent = user.email;
  document.querySelector("#account-menu").hidden = true;
  document.querySelector("#account-button").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

function showMessage(text, isError = true) {
  message.textContent = text;
  message.classList.toggle("success-message", !isError);
}

async function request(url, data) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Something went wrong.");
  return result;
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  submitButton.disabled = true;
  showMessage("");
  try {
    const result = await request(registering ? "/api/register" : "/api/login", { email: emailInput.value, password: passwordInput.value });
    showUser(result.user);
  } catch (error) {
    showMessage(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

modeButton.addEventListener("click", () => {
  registering = !registering;
  document.querySelector("#auth-heading").textContent = registering ? "Create your account" : "Log in to your account";
  submitButton.textContent = registering ? "Create account" : "Login";
  modeButton.textContent = registering ? "Already have an account? Log in" : "Create an account";
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  showMessage("");
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  landingPage.hidden = true;
  authCard.hidden = false;
  document.body.classList.remove("landing-mode");
  passwordInput.value = "";
  emailInput.value = "";
  window.scrollTo(0, 0);
});

const accountButton = document.querySelector("#account-button");
const accountMenu = document.querySelector("#account-menu");
accountButton.addEventListener("click", () => {
  const opening = accountMenu.hidden;
  accountMenu.hidden = !opening;
  accountButton.setAttribute("aria-expanded", String(opening));
});
document.addEventListener("click", event => {
  if (!event.target.closest(".notification-area")) { notificationPanel.hidden=true; notificationButton.setAttribute("aria-expanded","false"); }
  if (!event.target.closest(".account-area")) {
    accountMenu.hidden = true;
    accountButton.setAttribute("aria-expanded", "false");
  }
});
const notificationButton=document.querySelector("#notification-button"),notificationPanel=document.querySelector("#notification-panel");
let clientNotifications=[],readNotifications=new Set(JSON.parse(localStorage.getItem("sportlink-read-notifications")||"[]"));
function renderNotifications(){const list=document.querySelector("#notification-list"),unread=clientNotifications.filter(n=>!readNotifications.has(n.id));const count=document.querySelector("#notification-count");count.hidden=!unread.length;count.textContent=unread.length;list.innerHTML=clientNotifications.length?clientNotifications.slice(0,4).map(n=>{const key=({"E-sports":"esports"})[n.sport]||String(n.sport||"others").toLowerCase();const time=n.createdAt?new Date(n.createdAt).toLocaleString(undefined,{year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true}):"Recently";return `<button class="notification-item${readNotifications.has(n.id)?" is-read":""}" data-notification="${escapeHtml(n.id)}"><span class="notification-icon"><img src="assets/legend-${escapeHtml(key)}.png" alt=""></span><span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(time)}</small></span>${readNotifications.has(n.id)?"":"<i></i>"}</button>`}).join(""):'<p class="notification-empty">No notifications yet.</p>'}
fetch("/api/events").then(r=>r.json()).then(({events=[]})=>{clientNotifications=events.map(e=>({id:String(e.createdAt||e.title),title:`New ${e.sport||"sports"} event: ${e.title}`,sport:e.sport,createdAt:e.createdAt})).reverse();renderNotifications()}).catch(renderNotifications);
notificationButton.addEventListener("click",()=>{notificationPanel.hidden=!notificationPanel.hidden;notificationButton.setAttribute("aria-expanded",String(!notificationPanel.hidden))});
document.querySelector("#mark-notifications-read").addEventListener("click",()=>{clientNotifications.forEach(n=>readNotifications.add(n.id));localStorage.setItem("sportlink-read-notifications",JSON.stringify([...readNotifications]));renderNotifications()});
document.querySelector("#notification-list").addEventListener("click",e=>{const item=e.target.closest("[data-notification]");if(!item)return;readNotifications.add(item.dataset.notification);localStorage.setItem("sportlink-read-notifications",JSON.stringify([...readNotifications]));renderNotifications();notificationPanel.hidden=true;notificationButton.setAttribute("aria-expanded","false");document.querySelector('[data-nav="Events"]').click()});
document.querySelector("#see-all-notifications").addEventListener("click",()=>{notificationPanel.hidden=true;notificationButton.setAttribute("aria-expanded","false");document.querySelector('[data-nav="Events"]').click()});

const storyGrid = document.querySelector("#story-grid");
const relatedNews = document.querySelector("#related-news");
const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
function storyCardMarkup(story, compact = false) {
  return `<article class="story-card" data-story="${escapeHtml(story.articleTitle || story.title)}" data-card-title="${escapeHtml(story.title)}" data-copy="${escapeHtml(story.text)}" data-paragraph="${escapeHtml(story.paragraph || story.text)}" data-paragraph2="${escapeHtml(story.paragraph2 || story.text)}" data-image="${escapeHtml(story.heroImage || story.image)}" data-date="${escapeHtml(story.date)}" data-author="${escapeHtml(story.author)}" data-gallery="${escapeHtml(JSON.stringify(story.gallery || []))}" tabindex="0" role="link" aria-label="Read ${escapeHtml(story.title)}">
    <div class="card-image"><img src="${escapeHtml(story.image)}" alt="" /><span>${escapeHtml(story.tag)}</span></div>
    <div class="card-copy"><h3>${escapeHtml(story.title)}</h3>${compact ? "" : `<p>${escapeHtml(story.text)}</p><span class="read-more">Read More <span aria-hidden="true">→</span></span>`}</div></article>`;
}
function renderStoryCards() {
  storyGrid.innerHTML = stories.map(story => storyCardMarkup(story)).join("");
  relatedNews.innerHTML = stories.slice(0, 5).map(story => storyCardMarkup(story, true)).join("");
}
renderStoryCards();
fetch("/api/news").then(response => response.json()).then(data => {
  if (!data.stories?.length) return;
  stories = data.stories.map(story => ({ ...story, image: story.image || "assets/ccs-banner-crowd.png", heroImage: story.heroImage || story.image || "assets/ccs-banner-crowd.png" }));
  renderStoryCards();
}).catch(() => {});

const feedback = document.querySelector("#nav-feedback");
let feedbackTimer;
function showFeedback(text) {
  feedback.textContent = text;
  feedback.classList.remove("is-visible");
  void feedback.offsetWidth;
  feedback.classList.add("is-visible");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => feedback.classList.remove("is-visible"), 2600);
}

document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", async () => {
  document.body.classList.remove("team-detail-mode","team-long-title");
  document.querySelector(".banner-wordmark").innerHTML="<span>CCS</span><strong>SPORTS<br>HUB</strong>";
  document.querySelector(".banner-emblem").innerHTML='<img src="assets/ccs-phoenix-cutout.png" alt="CCS phoenix">';
  document.querySelector(".banner-tagline").hidden=false;
  ["#map-page","#events-page","#teams-page","#team-detail"].forEach(id=>document.querySelector(id).hidden=true);
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link === button;
    link.classList.toggle("is-active", active);
    link.setAttribute("aria-pressed", String(active));
  });
  const section = button.dataset.nav;
  if (section === "News") {
    document.querySelector("#map-page").hidden = true;
    document.querySelector("#article-view").hidden = true;
    document.querySelector(".news-section").hidden = false;
    document.querySelector(".breadcrumb").scrollIntoView({ behavior: "smooth", block: "start" });
    showFeedback("You’re viewing the latest CCS news.");
  } else if (section === "Map") {
    document.querySelector("#events-page").hidden = true;
    document.querySelector(".news-section").hidden = true;
    document.querySelector("#article-view").hidden = true;
    document.querySelector("#map-page").hidden = false;
    initSportMap();
    document.querySelector("#map-title").scrollIntoView({ behavior: "smooth", block: "start" });
    showFeedback("Explore sports and common game locations around Olongapo.");
  } else if (section === "Events") {
    document.querySelector(".news-section").hidden = true; document.querySelector("#article-view").hidden = true; document.querySelector("#map-page").hidden = true; document.querySelector("#events-page").hidden = false;
    renderEvents(); document.querySelector("#events-title").scrollIntoView({behavior:"smooth",block:"start"});
  } else if (section === "Teams") {
    document.querySelector(".news-section").hidden=true;document.querySelector("#article-view").hidden=true;document.querySelector("#teams-page").hidden=false;document.querySelector(".banner-wordmark").innerHTML="<span>CCS</span><strong>SPORTS<br>HUB</strong>";document.querySelector(".banner-emblem").innerHTML='<img src="assets/ccs-phoenix-cutout.png" alt="CCS phoenix">';document.querySelector(".banner-tagline").hidden=false;await loadClientTeams();
  } else {
    showFeedback(`${section} is coming soon. Check back when this section is ready!`);
  }
}));

let eventData = [["CCS Basketball Tournament","November 15, 2026 – November 16, 2026 | 8:00 AM – 5:00 PM","Gordon College Covered Court","Upcoming"],["CCS Volleyball League","November 28, 2026 – December 3, 2026 | 8:00 AM – 4:00 PM","Gordon College Covered Court","Upcoming"],["CCS Track & Field Meet","November 18, 2026 | 6:00 AM – 12:00 PM","Gordon College Track Oval","Upcoming"],["Taekwondo Training Camp","October 28, 2026 – November 1, 2026 | 2:00 PM – 6:00 PM","Gordon College Covered Court","Ongoing"],["CCS Hip Hop Dance Competition","October 10, 2025 | 10:00 AM – 6:00 PM","Gordon College Covered Court","Past"],["CCS Swimming Invitational","September 26, 2026 – September 27, 2026 | 7:00 AM – 5:00 PM","GC Swimming Pool","Past"],...Array.from({length:6},()=>["CCS Basketball Tournament","November 15, 2025 – November 16, 2025 | 8:00 AM – 5:00 PM","Gordon College Covered Court","Ongoing"])];
let eventFilter="All";fetch("/api/events").then(r=>r.json()).then(({events=[]})=>{eventData=[...eventData,...events.map(e=>[e.title,`${e.startDate} ${e.startTime} – ${e.endDate} ${e.endTime}`,e.location?.name||e.location?.address||"Sports location",e.status==="Completed"?"Past":e.status,e.cover])];if(!document.querySelector("#events-page").hidden)renderEvents()}).catch(()=>{});
function renderEvents(){const grid=document.querySelector("#events-grid");grid.innerHTML=eventData.filter(e=>eventFilter==="All"||e[3]===eventFilter).map(e=>`<article class="event-card"><div class="event-image" style="${e[4]?`background-image:url(${JSON.stringify(e[4])})`:""}"><span class="event-status ${e[3].toLowerCase()}">${e[3].toUpperCase()}</span></div><div class="event-copy"><strong>${e[0]}</strong><p>▦ &nbsp;${e[1]}</p><p>♟ &nbsp;${e[2]}</p></div><span class="event-arrow" aria-hidden="true">›</span></article>`).join("");const observer=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add("is-visible");observer.unobserve(x.target)}}),{threshold:.12});grid.querySelectorAll(".event-card").forEach(card=>observer.observe(card));}
document.querySelector(".event-filters").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;eventFilter=b.dataset.filter;document.querySelectorAll(".event-filter").forEach(x=>{x.classList.toggle("is-active",x===b);x.setAttribute("aria-pressed",String(x===b))});renderEvents()});

const sports = {
  Volleyball: { color: "#ff573d", icon: "◉" }, Swimming: { color: "#0755b8", icon: "≈" }, Basketball: { color: "#ffd84c", icon: "●" },
  "E-sports": { color: "#c45be7", icon: "⌘" }, Badminton: { color: "#53d9df", icon: "✦" }, Taekwondo: { color: "#fa3028", icon: "✦" }, Chess: { color: "#ed4cae", icon: "♟" }, Others: { color: "#00bd70", icon: "●" }
};
const sportLocations = [];
const sportColors = Object.fromEntries(Object.entries(sports).map(([name, data]) => [name, data.color]));
let mapInstance, mapLayer, activeLocation = null, activeSport = "All", searchTerm = "", markerById = new Map();
let allSportLocations=[];
async function loadAdminPins(){try{const [{locations=[]},{events=[]}]=await Promise.all([fetch("/api/map-locations").then(r=>r.json()),fetch("/api/events").then(r=>r.json())]);allSportLocations=locations.flatMap(p=>{const event=events.filter(e=>e.location?.id===p.id).at(-1);return event?[{...p,id:`admin-${p.id}`,sports:[event.sport||p.sport||"Others"],status:event.status||"Upcoming",startDate:event.startDate||"TBA",endDate:event.endDate||"TBA",startTime:event.startTime||"TBA",endTime:event.endTime||"",matchup:event.matchup||"",division:event.division||p.division||"Open",description:event.description||"",image:event.cover||"assets/ccs-campus-background.png",eventTitle:event.title}]:[]});if(!activeLocation&&allSportLocations.length)activeLocation=allSportLocations[0];if(mapInstance){renderMapMarkers();renderLocationCards();if(activeLocation)renderDetails(activeLocation)}}catch{}}
loadAdminPins();
function initSportMap() {
  renderLegend(); renderLocationCards(); renderDetails(activeLocation);
  if (mapInstance || !window.L) return;
  mapInstance = L.map("sport-map", { scrollWheelZoom: true }).setView([14.837,120.284], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapInstance);
  mapLayer = L.layerGroup().addTo(mapInstance);
  renderMapMarkers();
  setTimeout(() => mapInstance.invalidateSize(), 120);
}
function locationVisible(place) {
  const queryMatch = !searchTerm || `${place.name} ${place.address} ${place.sports.join(" ")} ${place.matchup}`.toLowerCase().includes(searchTerm);
  return queryMatch && (activeSport === "All" || place.sports.includes(activeSport) || (activeSport === "Others" && place.sports.some(s => ["Others","Taekwondo","Badminton","Chess"].includes(s))));
}
function markerIcon(place) {
  const sport = sports[place.sports[0]] || sports.Others;
  const slug=place.sports[0].toLowerCase().replace(/[^a-z]+/g,"-"); return L.divIcon({ className:"", html:`<span class="sport-marker sport-marker--${slug}${activeLocation?.id === place.id ? " is-selected" : ""}" aria-label="${escapeHtml(place.sports[0])}"><img src="assets/legend-${slug.replace("e-sports","esports")}.png" alt=""></span>`, iconSize:[34,34], iconAnchor:[17,17] });
}
function renderMapMarkers() {
  if (!mapLayer || !window.L) return;
  mapLayer.clearLayers(); markerById.clear();
  allSportLocations.filter(locationVisible).forEach(place => {
    const marker = L.marker([place.lat,place.lng], { icon:markerIcon(place), title:place.name, alt:`${place.sports.join(", ")} at ${place.name}` }).addTo(mapLayer);
    marker.on("click", () => selectLocation(place, false)); markerById.set(place.id, marker);
  });
}
function renderDetails(place) {
  if(!place){document.querySelector("#details-content").innerHTML='<div class="detail-empty">No published event selected.</div>';document.querySelector("#match-details").hidden=false;return}
  const sport = place.sports[0], badge = sports[sport] || sports.Others;
  const iconName={"Volleyball":"volleyball","Swimming":"swimming","Basketball":"basketball","E-sports":"esports","Taekwondo":"taekwondo","Badminton":"badminton","Chess":"chess","Others":"others"}[sport]||"others";
  document.querySelector("#details-content").innerHTML = `<div class="detail-body"><p class="detail-sport"><span class="sport-badge"><img src="assets/legend-${iconName}.png" alt=""></span><strong>${escapeHtml(sport)}</strong><span class="status-pill">${escapeHtml(place.status)}</span></p><h3 class="published-event-title">${escapeHtml(place.eventTitle||sport)}</h3><p class="detail-address"><span>⌖</span><span>${escapeHtml(place.address||place.name)}</span></p>${place.description?`<p class="published-event-description">${escapeHtml(place.description)}</p>`:""}<img class="detail-photo" src="${escapeHtml(place.image)}" alt="${escapeHtml(place.eventTitle||place.name)}" /><div class="detail-rows"><div class="detail-row"><span class="row-icon">◷</span><strong>Schedule</strong><span>${escapeHtml(place.startDate)} – ${escapeHtml(place.endDate)}</span></div><div class="detail-row"><span class="row-icon">◷</span><strong>Time</strong><span>${escapeHtml(place.startTime)}${place.endTime?` – ${escapeHtml(place.endTime)}`:""}</span></div><div class="detail-row"><span class="row-icon">♟</span><strong>Matchup</strong><span>${escapeHtml(place.matchup||"—")}</span></div><div class="detail-row"><span class="row-icon">♙</span><strong>Division</strong><span>${escapeHtml(place.division)}</span></div><div class="detail-row"><span class="row-icon">◌</span><strong>Status</strong><span class="status-pill">${escapeHtml(place.status)}</span></div></div></div>`;
  document.querySelector("#match-details").hidden = false;
}
function selectLocation(place, pan = true) {
  activeLocation = place; renderDetails(place); renderMapMarkers(); renderLocationCards();
  if (pan && mapInstance) mapInstance.flyTo([place.lat,place.lng], Math.max(mapInstance.getZoom(),15), { duration:.45 });
}
function renderLegend() {
  const names = ["Volleyball","Swimming","Taekwondo","Badminton","Basketball","E-sports","Chess","Others"];
  const icons={"Volleyball":"volleyball","Swimming":"swimming","Taekwondo":"taekwondo","Badminton":"badminton","Basketball":"basketball","E-sports":"esports","Chess":"chess","Others":"others"};
  document.querySelector("#legend-items").innerHTML = names.map(name => `<div class="legend-item"><span class="legend-swatch" style="--legend-icon:url('assets/legend-${icons[name]}.png')"></span>${escapeHtml(name)}</div>`).join("");
}
function renderLocationCards() {
  const places = allSportLocations.filter(locationVisible);
  document.querySelector("#location-track").innerHTML = places.length ? places.map(place => `<button class="location-card" type="button" data-location="${place.id}" aria-label="Show ${escapeHtml(place.name)} on map"><img src="${escapeHtml(place.image)}" alt="" loading="lazy" /><strong>${escapeHtml(place.name)}</strong></button>`).join("") : `<p class="location-empty">No matching sports locations. Try another sport or search.</p>`;
}
document.querySelector(".sport-filters").addEventListener("click", event => {
  const button = event.target.closest(".sport-filter"); if (!button) return;
  activeSport = button.dataset.sport;
  document.querySelectorAll(".sport-filter").forEach(filter => { const selected = filter === button; filter.classList.toggle("is-active",selected); filter.setAttribute("aria-pressed",String(selected)); });
  const filtered = allSportLocations.filter(locationVisible);
  if (!filtered.some(place => place.id === activeLocation.id) && filtered[0]) selectLocation(filtered[0]);
  renderMapMarkers(); renderLocationCards();
});
document.querySelector("#map-search").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  const filtered = allSportLocations.filter(locationVisible);
  if (!filtered.some(place => place.id === activeLocation.id) && filtered[0]) selectLocation(filtered[0]);
  renderMapMarkers(); renderLocationCards();
});
document.querySelector("#location-track").addEventListener("click", event => { const card = event.target.closest(".location-card"); const place = allSportLocations.find(item => item.id === card?.dataset.location); if (place) selectLocation(place); });
document.querySelector("#locations-prev").addEventListener("click", () => document.querySelector("#location-track").scrollBy({ left:-320,behavior:"smooth" }));
document.querySelector("#locations-next").addEventListener("click", () => document.querySelector("#location-track").scrollBy({ left:320,behavior:"smooth" }));
document.querySelector("#close-details").addEventListener("click", () => { document.querySelector("#match-details").hidden = true; });
document.querySelector("#map-locate").addEventListener("click", () => { if (mapInstance) mapInstance.flyTo([14.837,120.284],14); });

const defaultTeamRows=[["CCS HIPHOP DANCERS","A passionate dance crew that showcases creativity, teamwork, and energy through every performance.","Others"],["CCS Phoenixes Esports","A competitive gaming team that combines strategy, communication, and teamwork to take on every challenge.","E-sports"],["CCS BASKETBALL TEAM","A dedicated team that brings skill, determination, and teamwork to every game on the court.","Basketball"],["CCS VOLLEYBALL TEAM","A team built on trust, coordination, and sportsmanship, working together toward every point.","Volleyball"],["CCS TAEKWONDO TEAM","A group of martial artists developing discipline, confidence, and focus through training and competition.","Others"],["CCS BADMINTON TEAM","Quick reflexes and smart strategies drive this team as its players challenge themselves on the court.","Others"],["CCS MOBILE LEGENDS SQUAD","A squad focused on tactical plays, team coordination, and making smart decisions in every match.","E-sports"],["CCS Chess Club","A community of strategic thinkers sharpening their minds through friendly matches and competitive play.","Others"],["CCS PHOENIX PEP SQUAD","An energetic group that brings school spirit, excitement, and support to campus sports events.","Others"]];
const defaultTeamPlayers=[{name:"Klent Josh Vargas",number:"9",position:"Open Hitter",image:"assets/ccs-phoenix-banner.png"},{name:"Kairo Eclarinal",number:"9",position:"Middle Blocker",image:"assets/ccs-phoenix-banner.png"},{name:"Zandro Papa",number:"9",position:"Middle Blocker",image:"assets/ccs-phoenix-banner.png"},{name:"John Lloyd Cruz",number:"9",position:"Open Hitter",image:"assets/ccs-phoenix-banner.png"},{name:"Vishu Mariano",number:"9",position:"Libero",image:"assets/ccs-phoenix-banner.png"}];
let teamRows=defaultTeamRows.map((row,i)=>({id:`team-${i+1}`,name:row[0],summary:row[1],category:row[2],overview:`${row[1]} The team proudly represents the College of Computer Studies (CCS), carrying the spirit and determination of our school in every game.`,placement:"1st Runner Up",playerCount:"12 Players",cover:"assets/ccs-banner-crowd.png",players:defaultTeamPlayers,joinBackground:"assets/team-join-banner.png",tryoutLink:""}));let teamFilter="All",teamSearch="",teamPageContent={title:"EXPLORE OUR TEAMS.",subtitle:"Check out these incredible CCS athletes!"};
function escapeTeam(value){return String(value||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function teamImage(value,fallback){return /^(assets\/[\w./-]+|data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+)$/i.test(String(value||""))?value:fallback}
function renderTeams(){const grid=document.querySelector("#team-grid");grid.innerHTML=teamRows.filter(t=>(teamFilter==="All"||t.category===teamFilter)&&(`${t.name} ${t.summary}`.toLowerCase().includes(teamSearch))).map(t=>`<article class="team-card"><img src="${teamImage(t.cover,"assets/ccs-banner-crowd.png")}" alt="${escapeTeam(t.name)}"><strong>${escapeTeam(t.name)}</strong><p>${escapeTeam(t.summary)}</p><button data-team="${teamRows.indexOf(t)}">View Teams</button></article>`).join("")||'<p class="team-empty">No teams match your search.</p>'}
async function loadClientTeams(){try{const response=await fetch("/api/teams");if(response.ok){const result=await response.json();if(Array.isArray(result.teams))teamRows=result.teams;if(result.page)teamPageContent={...teamPageContent,...result.page}}}catch{}document.querySelector("#teams-title").textContent=teamPageContent.title;document.querySelector("#teams-subtitle").textContent=teamPageContent.subtitle;renderTeams()}
document.querySelector(".team-filters").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;teamFilter=b.dataset.filter;document.querySelectorAll(".team-filter").forEach(x=>x.classList.toggle("is-active",x===b));renderTeams()});
document.querySelector("#team-search").addEventListener("input",e=>{teamSearch=e.target.value.trim().toLowerCase();renderTeams()});
document.querySelector("#team-grid").addEventListener("click",e=>{const i=e.target.closest("[data-team]")?.dataset.team;if(i===undefined)return;const t=teamRows[Number(i)],d=document.querySelector("#team-detail"),players=t.players||[];document.querySelector("#teams-page").hidden=true;d.hidden=false;document.body.classList.add("team-detail-mode");document.body.classList.toggle("team-long-title",t.name.length>18);const bannerTitle=escapeTeam(t.name.replace(/^CCS /,"").replace(" TEAM"," TEAM")).replace(" TEAM","<br>TEAM");document.querySelector(".banner-wordmark").innerHTML=`<span>CCS</span><strong>${bannerTitle}</strong>`;document.querySelector(".banner-emblem").innerHTML='<img class="team-ball" src="assets/team-sport-balls.png" alt="">';document.querySelector(".banner-tagline").hidden=true;const joinImage=teamImage(t.joinBackground,"assets/team-join-banner.png"),joinAlt=escapeTeam("Join the team. Tryouts open in Google Forms."),tryoutLink=/^https?:\/\//i.test(t.tryoutLink||"")?escapeTeam(t.tryoutLink):"";d.innerHTML=`<p class="breadcrumb">HOME / TEAMS / ${escapeTeam(t.name)}</p><section class="team-overview"><div><h2>TEAM OVERVIEW</h2><p>${escapeTeam(t.overview||t.summary)}</p><div class="team-stats"><span>🏆 <small>Recent Placement<br><b>${escapeTeam(t.placement||"—")}</b></small></span><span>♟ <small>Total Players<br><b>${escapeTeam(t.playerCount||`${players.length} Players`)}</b></small></span></div></div><img src="${teamImage(t.cover,"assets/ccs-banner-crowd.png")}" alt="${escapeTeam(t.name)}"></section><h2 class="players-title">MEET OUR PLAYERS</h2><div class="player-carousel"><button data-dir="-1" aria-label="Previous players">‹</button><div class="player-track">${players.map(p=>`<article><img src="${teamImage(p.image,"assets/ccs-phoenix-banner.png")}" alt="${escapeTeam(p.name)}"><b>${escapeTeam(p.name)}</b><span><em>#${escapeTeam(p.number||"—")}</em> | ${escapeTeam(p.position||"Player")}</span></article>`).join("")}</div><button data-dir="1" aria-label="Next players">›</button></div><aside class="join-team"><img src="${joinImage}" alt="${joinAlt}"><a class="team-tryout-button-hitarea" href="${tryoutLink||"#"}" target="_blank" rel="noopener noreferrer" aria-label="Tryouts — opens in Google Forms" ${tryoutLink?"":"aria-disabled=\"true\""}><span>TRYOUTS</span><small>Opens in Google Forms.</small></a></aside>`;d.querySelector(".team-tryout-button-hitarea").addEventListener("click",e=>{if(!tryoutLink){e.preventDefault();showFeedback("Tryouts will be announced soon. Check back for the sign-up form!")}});d.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>d.querySelector(".player-track").scrollBy({left:Number(b.dataset.dir)*260,behavior:"smooth"}));});
const storyDialog = document.querySelector("#story-dialog");
function openStory(card) {
  document.querySelector("#article-title").textContent = card.dataset.story;
  document.querySelector("#article-crumb-title").textContent = ` / ${card.dataset.story}`;
  document.querySelector("#article-subtitle").textContent = card.dataset.story;
  document.querySelector("#article-paragraph").textContent = card.dataset.paragraph || card.dataset.copy;
  document.querySelector("#article-paragraph-two").textContent = card.dataset.paragraph2 || card.dataset.copy;
  const hero = document.querySelector(".article-hero-image"); hero.src = card.dataset.image; hero.alt = card.dataset.story;
  document.querySelector(".article-meta time").textContent = card.dataset.date || "October 30, 2026";
  document.querySelector(".article-meta .article-author").textContent = card.dataset.author || "CCS Sports Hub Editorial Team";
  let gallery = []; try { gallery = JSON.parse(card.dataset.gallery || "[]"); } catch {}
  if (!gallery.length) gallery = [card.dataset.image, "assets/sportlink-background.jpg", "assets/ccs-campus-background.png", "assets/ccs-banner-crowd.png", "assets/sportlink-background.jpg"];
  const photoWrap = document.querySelector("#article-photos");
  photoWrap.replaceChildren(...gallery.slice(0, 8).map((src, index) => {
    const button = document.createElement("button"); button.className = `article-photo${index === 0 ? " is-selected" : ""}`; button.type = "button"; button.dataset.image = src; button.setAttribute("aria-pressed", String(index === 0)); button.setAttribute("aria-label", `Show attached photo ${index + 1}`);
    const img = document.createElement("img"); img.src = src; img.alt = `Article photo ${index + 1}`; button.append(img); return button;
  }));
  document.querySelector(".news-section").hidden = true;
  document.querySelector("#article-view").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
storyGrid.addEventListener("click", event => { const card = event.target.closest(".story-card"); if (card) openStory(card); });
storyGrid.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { const card = event.target.closest(".story-card"); if (card) { event.preventDefault(); openStory(card); } } });
relatedNews.addEventListener("click", event => { const card = event.target.closest(".story-card"); if (card) openStory(card); });
relatedNews.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { const card = event.target.closest(".story-card"); if (card) { event.preventDefault(); openStory(card); } } });
document.querySelector("#back-to-news").addEventListener("click", () => {
  document.querySelector("#article-view").hidden = true;
  document.querySelector(".news-section").hidden = false;
  document.querySelector('[data-nav="News"]').click();
});
document.querySelector("#article-photos").addEventListener("click", event => {
  const thumbnail = event.target.closest(".article-photo");
  if (!thumbnail) return;
  const hero = document.querySelector(".article-hero-image");
  const image = thumbnail.querySelector("img");
  hero.src = thumbnail.dataset.image;
  hero.alt = image.alt;
  document.querySelectorAll(".article-photo").forEach(photo => {
    const selected = photo === thumbnail;
    photo.classList.toggle("is-selected", selected);
    photo.setAttribute("aria-pressed", String(selected));
  });
});

fetch("/api/config").then(response => response.json()).then(({ googleClientId }) => {
  if (!googleClientId) return;
  document.querySelector("#google-note").hidden = true;
  const initialize = () => {
    if (!window.google?.accounts?.id) return setTimeout(initialize, 100);
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => {
      try { const result = await request("/api/google", { credential }); showUser(result.user); }
      catch (error) { showMessage(error.message); }
    } });
    window.google.accounts.id.renderButton(document.querySelector("#google-signin"), { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 260 });
  };
  initialize();
}).catch(() => { document.querySelector("#google-note").textContent = "Google sign-in is unavailable."; });

const localDebugUser = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? { email: "markaronilagan22@gmail.com", name: "Mark Aron Ilagan", provider: "debug" }
  : null;
if (localDebugUser) showUser(localDebugUser);
fetch("/api/session", { credentials: "same-origin" }).then(response => response.json()).then(({ user }) => { if (user) showUser(user); }).catch(() => {});
