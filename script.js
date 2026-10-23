const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const formMessage = document.querySelector("#form-message");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!usernameInput.value.trim() || !passwordInput.value) {
    formMessage.textContent = "Enter your username and password.";
    (!usernameInput.value.trim() ? usernameInput : passwordInput).focus();
    return;
  }

  formMessage.textContent = `Welcome back, ${usernameInput.value.trim()}!`;
});
