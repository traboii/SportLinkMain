const authCard = document.querySelector("#auth-card");
const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const modeButton = document.querySelector("#mode-button");
const landingPage = document.querySelector("#landing-page");
let registering = false;

const stories = [
  { image: "orange", title: "CCS: Hip-hop dancers team take 2nd runner up", tag: "DANCE", text: "The beat dropped. The energy exploded. And CCS stepped up! Our dancers brought the spirit to the floor." },
  { image: "phoenix", title: "Ka-Phoenix represent at the campus games", tag: "CAMPUS LIFE", text: "A proud day for our CCS community. Meet the students who showed up, cheered loud, and made every moment count." },
  { image: "crowd", title: "One team, one crowd, one unforgettable day", tag: "COMMUNITY", text: "From the first whistle to the final photo, CCS came together to celebrate sport, friendship, and school spirit." },
  { image: "field", title: "The best moments from this season", tag: "HIGHLIGHTS", text: "A look back at the plays, the teamwork, and the memories that made this season one to remember." },
  { image: "crowd", title: "CCS athletes bring the heat at the games", tag: "ATHLETICS", text: "Our Ka-Phoenix brought focus, heart, and determination to every match. Congratulations to all our competitors." },
  { image: "orange", title: "Celebrating the people behind the plays", tag: "COMMUNITY", text: "Coaches, volunteers, and supporters make every game day special. This win belongs to the whole CCS family." },
  { image: "field", title: "Game day: the CCS spirit in full force", tag: "GAME DAY", text: "The sidelines were full, the energy was high, and our community showed what it means to stand together." },
  { image: "phoenix", title: "A season powered by teamwork", tag: "TEAMS", text: "Every practice and every point brought us closer. Here are a few moments worth celebrating again." },
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
storyGrid.innerHTML = stories.map((story, index) => `
  <article class="story-card">
    <button class="card-image ${story.image}" type="button" data-story="${story.title}" data-copy="${story.text}" aria-label="Read ${story.title}"><span>${story.tag}</span></button>
    <div class="card-copy">
      <h3>${story.title}</h3>
      <p>${story.text}</p>
      <button class="read-more" type="button" data-story="${story.title}" data-copy="${story.text}">Read More <span aria-hidden="true">→</span></button>
    </div>
  </article>`).join("");

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
    document.querySelector(".breadcrumb").scrollIntoView({ behavior: "smooth", block: "start" });
    showFeedback("You’re viewing the latest CCS news.");
  } else {
    showFeedback(`${section} is coming soon. Check back when this section is ready!`);
  }
}));

const storyDialog = document.querySelector("#story-dialog");
document.addEventListener("click", event => {
  const trigger = event.target.closest("[data-story]");
  if (!trigger) return;
  document.querySelector("#dialog-title").textContent = trigger.dataset.story;
  document.querySelector("#dialog-copy").textContent = trigger.dataset.copy || "Step onto the mat with our Ka-Phoenix as they bring power, focus, and determination to every bout. Catch the highlights and celebrate the CCS spirit.";
  storyDialog.showModal();
});
document.querySelector(".dialog-close").addEventListener("click", () => storyDialog.close());
document.querySelector(".dialog-done").addEventListener("click", () => storyDialog.close());
storyDialog.addEventListener("click", event => { if (event.target === storyDialog) storyDialog.close(); });

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
