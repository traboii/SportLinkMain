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
  if (!event.target.closest(".account-area")) {
    accountMenu.hidden = true;
    accountButton.setAttribute("aria-expanded", "false");
  }
});

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

document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", () => {
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
    document.querySelector(".news-section").hidden = true;
    document.querySelector("#article-view").hidden = true;
    document.querySelector("#map-page").hidden = false;
    initSportMap();
    document.querySelector("#map-title").scrollIntoView({ behavior: "smooth", block: "start" });
    showFeedback("Explore sports and common game locations around Olongapo.");
  } else {
    showFeedback(`${section} is coming soon. Check back when this section is ready!`);
  }
}));

const sports = {
  Volleyball: { color: "#ff573d", icon: "◉" }, Swimming: { color: "#0755b8", icon: "≈" }, Basketball: { color: "#ffd84c", icon: "●" },
  "E-sports": { color: "#c45be7", icon: "⌘" }, Badminton: { color: "#53d9df", icon: "✦" }, Taekwondo: { color: "#fa3028", icon: "✦" }, Chess: { color: "#ed4cae", icon: "♟" }, Others: { color: "#00bd70", icon: "●" }
};
const sportLocations = [
  { id:"gordon", name:"Gordon College Campus", sports:["Volleyball","Basketball","Taekwondo","Badminton","E-sports","Chess","Others"], address:"Olongapo City Sports Complex, Donor Street, East Tapinac", lat:14.8329,lng:120.2822, image:"assets/ccs-campus-background.png", time:"TBA", matchup:"CCS vs Visiting Teams", division:"Men’s", status:"Upcoming" },
  { id:"ymca", name:"YMCA Swimming Pool", sports:["Swimming"], address:"Donor Street, East Tapinac, Olongapo City", lat:14.832543,lng:120.283312, image:"assets/ccs-banner-crowd.png", time:"TBA", matchup:"CCS Swim Team Practice", division:"Open", status:"Upcoming" },
  { id:"rizal", name:"Rizal Triangle Covered Court", sports:["Volleyball","Basketball"], address:"Rizal Triangle, Olongapo City", lat:14.84152,lng:120.28688, image:"assets/sportlink-background.jpg", time:"TBA", matchup:"CCS vs CBA", division:"Men’s", status:"Ongoing" }
];
const sportColors = Object.fromEntries(Object.entries(sports).map(([name, data]) => [name, data.color]));
let mapInstance, mapLayer, activeLocation = sportLocations[2], activeSport = "All", searchTerm = "", markerById = new Map();
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
  return L.divIcon({ className:"", html:`<span class="sport-marker${activeLocation?.id === place.id ? " is-selected" : ""}" style="background:${sport.color}">${sport.icon}</span>`, iconSize:[34,34], iconAnchor:[17,17] });
}
function renderMapMarkers() {
  if (!mapLayer || !window.L) return;
  mapLayer.clearLayers(); markerById.clear();
  sportLocations.filter(locationVisible).forEach(place => {
    const marker = L.marker([place.lat,place.lng], { icon:markerIcon(place), title:place.name, alt:`${place.sports.join(", ")} at ${place.name}` }).addTo(mapLayer);
    marker.on("click", () => selectLocation(place, false)); markerById.set(place.id, marker);
  });
}
function renderDetails(place) {
  const sport = place.sports[0], badge = sports[sport] || sports.Others;
  document.querySelector("#details-content").innerHTML = `<div class="detail-body"><p class="detail-sport"><span class="sport-badge" style="background:${badge.color}">${badge.icon}</span><strong>${escapeHtml(sport)}</strong><span class="status-pill">${escapeHtml(place.status)}</span></p><p class="detail-address"><span>⌖</span><span>${escapeHtml(place.name)}</span></p><img class="detail-photo" src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" /><div class="detail-rows"><div class="detail-row"><span class="row-icon">◷</span><strong>Time</strong><span>${escapeHtml(place.time)}</span></div><div class="detail-row"><span class="row-icon">♟</span><strong>Matchup</strong><span>${escapeHtml(place.matchup)}</span></div><div class="detail-row"><span class="row-icon">♙</span><strong>Division</strong><span>${escapeHtml(place.division)}</span></div><div class="detail-row"><span class="row-icon">◌</span><strong>Status</strong><span class="status-pill">${escapeHtml(place.status)}</span></div></div></div>`;
  document.querySelector("#match-details").hidden = false;
}
function selectLocation(place, pan = true) {
  activeLocation = place; renderDetails(place); renderMapMarkers(); renderLocationCards();
  if (pan && mapInstance) mapInstance.flyTo([place.lat,place.lng], Math.max(mapInstance.getZoom(),15), { duration:.45 });
}
function renderLegend() {
  const names = ["Volleyball","Swimming","Taekwondo","Badminton","Basketball","E-sports","Chess","Others"];
  document.querySelector("#legend-items").innerHTML = names.map(name => `<div class="legend-item"><span class="legend-swatch" style="background:${sportColors[name]}"></span>${escapeHtml(name)}</div>`).join("");
}
function renderLocationCards() {
  const places = sportLocations.filter(locationVisible);
  document.querySelector("#location-track").innerHTML = places.length ? places.map(place => `<button class="location-card" type="button" data-location="${place.id}" aria-label="Show ${escapeHtml(place.name)} on map"><img src="${escapeHtml(place.image)}" alt="" loading="lazy" /><strong>${escapeHtml(place.name)}</strong></button>`).join("") : `<p class="location-empty">No matching sports locations. Try another sport or search.</p>`;
}
document.querySelector(".sport-filters").addEventListener("click", event => {
  const button = event.target.closest(".sport-filter"); if (!button) return;
  activeSport = button.dataset.sport;
  document.querySelectorAll(".sport-filter").forEach(filter => { const selected = filter === button; filter.classList.toggle("is-active",selected); filter.setAttribute("aria-pressed",String(selected)); });
  const filtered = sportLocations.filter(locationVisible);
  if (!filtered.some(place => place.id === activeLocation.id) && filtered[0]) selectLocation(filtered[0]);
  renderMapMarkers(); renderLocationCards();
});
document.querySelector("#map-search").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  const filtered = sportLocations.filter(locationVisible);
  if (!filtered.some(place => place.id === activeLocation.id) && filtered[0]) selectLocation(filtered[0]);
  renderMapMarkers(); renderLocationCards();
});
document.querySelector("#location-track").addEventListener("click", event => { const card = event.target.closest(".location-card"); const place = sportLocations.find(item => item.id === card?.dataset.location); if (place) selectLocation(place); });
document.querySelector("#locations-prev").addEventListener("click", () => document.querySelector("#location-track").scrollBy({ left:-320,behavior:"smooth" }));
document.querySelector("#locations-next").addEventListener("click", () => document.querySelector("#location-track").scrollBy({ left:320,behavior:"smooth" }));
document.querySelector("#close-details").addEventListener("click", () => { document.querySelector("#match-details").hidden = true; });
document.querySelector("#map-locate").addEventListener("click", () => { if (mapInstance) mapInstance.flyTo([14.837,120.284],14); });

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

fetch("/api/session", { credentials: "same-origin" }).then(response => response.json()).then(({ user }) => { if (user) showUser(user); }).catch(() => {});
