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
}
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
