const authCard = document.querySelector("#auth-card");
const successCard = document.querySelector("#success-card");
const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const modeButton = document.querySelector("#mode-button");
const googleNote = document.querySelector("#google-note");
let registering = false;
function showUser(user) { authCard.hidden = true; successCard.hidden = false; document.querySelector("#signed-in-email").textContent = user.email; document.querySelector("#signed-in-role").hidden = user.role !== "admin"; }
function showMessage(text, isError = true) { message.textContent = text; message.classList.toggle("success-message", !isError); }
async function request(url, data) { const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw Error(result.error || "Something went wrong."); return result; }
loginForm.addEventListener("submit", async event => { event.preventDefault(); submitButton.disabled = true; showMessage(""); try { const result = await request(registering ? "/api/register" : "/api/login", { email: emailInput.value, password: passwordInput.value }); showUser(result.user); } catch (error) { showMessage(error.message); } finally { submitButton.disabled = false; } });
modeButton.addEventListener("click", () => { registering = !registering; document.querySelector("#auth-heading").textContent = registering ? "Create your account" : "Log in to your account"; submitButton.textContent = registering ? "Create account" : "Login"; modeButton.textContent = registering ? "Already have an account? Log in" : "Create an account"; passwordInput.autocomplete = registering ? "new-password" : "current-password"; showMessage(""); });
document.querySelector("#logout-button").addEventListener("click", async () => { await fetch("/api/logout", { method: "POST", credentials: "same-origin" }); successCard.hidden = true; authCard.hidden = false; passwordInput.value = ""; });
fetch("/api/config").then(response => response.json()).then(({ googleClientId }) => { if (!googleClientId) return; googleNote.hidden = true; const initialize = () => { if (!window.google?.accounts?.id) return setTimeout(initialize, 100); window.google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => { try { const result = await request("/api/google", { credential }); showUser(result.user); } catch (error) { showMessage(error.message); } } }); window.google.accounts.id.renderButton(document.querySelector("#google-signin"), { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 260 }); }; initialize(); }).catch(() => { googleNote.textContent = "Google sign-in is unavailable."; });
fetch("/api/session", { credentials: "same-origin" }).then(response => response.json()).then(({ user }) => { if (user) showUser(user); }).catch(() => {});
