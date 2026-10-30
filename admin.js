const loginCard = document.querySelector("#admin-login-card");
const dashboard = document.querySelector("#admin-dashboard");
const loginForm = document.querySelector("#admin-login-form");
const loginMessage = document.querySelector("#admin-message");

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function showLogin() { dashboard.hidden = true; loginCard.hidden = false; }
async function showDashboard(user) {
  loginCard.hidden = true;
  dashboard.hidden = false;
  document.querySelector("#admin-welcome").textContent = `Signed in as ${user.email}`;
  await loadUsers();
  await loadNewsEditor();
}
let newsStories = [];
const defaultNewsStories = [
  ["CCS: Hip-hop dancers team take 2nd runner up", "DANCE", "The beat dropped. The energy exploded. And CCS stepped up! Our dancers brought the spirit to the floor.", "assets/sportlink-background.jpg"],
  ["Ka-Phoenix represent at the campus games", "CAMPUS LIFE", "A proud day for our CCS community. Meet the students who showed up, cheered loud, and made every moment count.", "assets/ccs-banner-crowd.png"],
  ["One team, one crowd, one unforgettable day", "COMMUNITY", "From the first whistle to the final photo, CCS came together to celebrate sport, friendship, and school spirit.", "assets/ccs-banner-crowd.png"],
  ["The best moments from this season", "HIGHLIGHTS", "A look back at the plays, the teamwork, and the memories that made this season one to remember.", "assets/ccs-campus-background.png"],
  ["CCS athletes bring the heat at the games", "ATHLETICS", "Our Ka-Phoenix brought focus, heart, and determination to every match. Congratulations to all our competitors.", "assets/sportlink-background.jpg"],
  ["Celebrating the people behind the plays", "COMMUNITY", "Coaches, volunteers, and supporters make every game day special. This win belongs to the whole CCS family.", "assets/ccs-banner-crowd.png"],
  ["Game day: the CCS spirit in full force", "GAME DAY", "The sidelines were full, the energy was high, and our community showed what it means to stand together.", "assets/ccs-campus-background.png"],
  ["A season powered by teamwork", "TEAMS", "Every practice and every point brought us closer. Here are a few moments worth celebrating again.", "assets/ccs-banner-crowd.png"],
].map((story, i) => ({ id: `story-${i + 1}`, title: story[0], tag: story[1], text: story[2], articleTitle: story[0], date: "October 30, 2026", author: "CCS Sports Hub Editorial Team", paragraph: story[2], paragraph2: "Celebrate the teamwork, dedication, and spirit of the CCS community. More highlights and photos from the event are collected below.", image: story[3], heroImage: story[3], gallery: [story[3], "assets/sportlink-background.jpg", "assets/ccs-campus-background.png", "assets/ccs-banner-crowd.png", "assets/sportlink-background.jpg"] }));
async function loadNewsEditor() {
  try { const result = await api("/api/admin/news"); newsStories = result.stories.length ? result.stories : structuredClone(defaultNewsStories); }
  catch (error) { document.querySelector("#news-save-message").textContent = error.message; return; }
  renderStoryOptions();
  fillNewsForm();
}
function renderStoryOptions(selected = 0) {
  const select = document.querySelector("#news-story-select");
  select.replaceChildren(...newsStories.map((story, index) => { const option = document.createElement("option"); option.value = index; option.textContent = story.title || `Untitled story ${index + 1}`; return option; }));
  if (newsStories.length) select.value = String(Math.min(selected, newsStories.length - 1));
}
function fillNewsForm() {
  const story = newsStories[Number(document.querySelector("#news-story-select").value)];
  if (!story) return;
  const form = document.querySelector("#news-story-form");
  for (const key of ["title", "tag", "text", "image", "articleTitle", "date", "author", "paragraph", "paragraph2", "heroImage"]) form.elements[key].value = story[key] || "";
  form.elements.imageFile.value = ""; form.elements.heroFile.value = "";
  const gallery = document.querySelector("#gallery-editor");
  gallery.replaceChildren(...Array.from({ length: 5 }, (_, index) => {
    const label = document.createElement("label"); label.textContent = `Photo ${index + 1}`;
    const input = document.createElement("input"); input.dataset.galleryIndex = index; input.value = story.gallery?.[index] || "";
    const file = document.createElement("input"); file.type = "file"; file.accept = "image/png,image/jpeg,image/webp"; file.dataset.galleryFile = index;
    label.append(input, file); return label;
  }));
  document.querySelector("#news-save-message").textContent = "";
}
async function readImage(file) {
  if (!file) return "";
  if (file.size > 3 * 1024 * 1024) throw new Error("Each uploaded image must be 3 MB or smaller.");
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Could not read image.")); reader.readAsDataURL(file); });
}
document.querySelector("#news-story-select").addEventListener("change", fillNewsForm);
document.querySelector("#add-news-story").addEventListener("click", () => {
  if (newsStories.length >= 30) return;
  newsStories.push({ id: `story-${Date.now()}`, title: "New CCS story", tag: "NEWS", text: "", articleTitle: "New CCS story", date: "", author: "CCS Sports Hub Editorial Team", paragraph: "", paragraph2: "", image: "assets/ccs-banner-crowd.png", heroImage: "assets/ccs-banner-crowd.png", gallery: [] });
  renderStoryOptions(newsStories.length - 1); fillNewsForm();
});
document.querySelector("#delete-news-story").addEventListener("click", () => {
  if (!newsStories.length) return;
  const index = Number(document.querySelector("#news-story-select").value);
  newsStories.splice(index, 1); renderStoryOptions(Math.max(0, index - 1)); fillNewsForm();
});
document.querySelector("#news-story-form").addEventListener("submit", async event => {
  event.preventDefault(); const button = document.querySelector(".admin-save-news"), status = document.querySelector("#news-save-message"); button.disabled = true; status.textContent = "Saving…";
  try {
    const form = event.currentTarget, index = Number(document.querySelector("#news-story-select").value), story = newsStories[index];
    for (const key of ["title", "tag", "text", "image", "articleTitle", "date", "author", "paragraph", "paragraph2", "heroImage"]) story[key] = form.elements[key].value;
    const cardUpload = await readImage(form.elements.imageFile.files[0]); if (cardUpload) story.image = cardUpload;
    const heroUpload = await readImage(form.elements.heroFile.files[0]); if (heroUpload) story.heroImage = heroUpload;
    story.gallery = await Promise.all(Array.from(document.querySelectorAll("[data-gallery-index]"), async input => {
      const i = Number(input.dataset.galleryIndex), upload = document.querySelector(`[data-gallery-file="${i}"]`).files[0];
      return await readImage(upload) || input.value.trim();
    })).then(items => items.filter(Boolean));
    const result = await api("/api/admin/news", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stories: newsStories }) });
    newsStories = result.stories; renderStoryOptions(index); fillNewsForm(); status.textContent = "Saved. Clients will see this content on the News page.";
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});
async function loadUsers() {
  const list = document.querySelector("#admin-user-list");
  list.innerHTML = '<p class="empty-users">Loading accounts…</p>';
  try {
    const { users, total } = await api("/api/admin/users");
    document.querySelector("#client-count").textContent = total;
    if (!users.length) { list.innerHTML = '<p class="empty-users">No client accounts yet.</p>'; return; }
    list.replaceChildren(...users.map(user => {
      const row = document.createElement("article");
      row.className = "admin-user-row";
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = user.name || user.email;
      const email = document.createElement("span");
      email.textContent = user.email;
      details.append(name, email);
      const provider = document.createElement("span");
      provider.className = "admin-provider";
      provider.textContent = user.provider;
      row.append(details, provider);
      return row;
    }));
  } catch (error) {
    list.innerHTML = "";
    const text = document.createElement("p");
    text.className = "empty-users";
    text.textContent = error.message;
    list.append(text);
  }
}
loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.querySelector("#admin-submit");
  button.disabled = true;
  loginMessage.textContent = "";
  try {
    const { user } = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: document.querySelector("#admin-email").value, password: document.querySelector("#admin-password").value }) });
    await showDashboard(user);
  } catch (error) { loginMessage.textContent = error.message; }
  finally { button.disabled = false; }
});
document.querySelector("#refresh-users").addEventListener("click", loadUsers);
document.querySelector("#admin-logout").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  loginForm.reset();
  showLogin();
});
api("/api/session").then(({ user }) => {
  if (user?.role === "admin") return showDashboard(user);
  if (user) api("/api/logout", { method: "POST" }).catch(() => {});
}).catch(() => {});
