import { firebaseConfig } from "./firebase-config.js";
import { validate } from "./validation.js";

const getElement = (id) => document.getElementById(id);
const REGISTER_MODE = "register";
const LOGIN_MODE = "login";

const FIELD_CONFIG = {
  name: ["Name", "Student's full name", "text", "name"],
  email: ["Email", "student@example.com", "email", "email"],
  password: [
    "Password",
    "Create a secure password",
    "password",
    "new-password",
  ],
  mobile: ["Mobile Number", "10-digit mobile number", "tel", "tel"],
  username: ["Username", "e.g. arya7_", "text", "username"],
};

const AUTH_ERROR_MESSAGES = {
  "auth/email-already-in-use": "This email is registered. Sign in instead.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/weak-password":
    "Choose a stronger password with at least 6 characters.",
  "auth/password-does-not-meet-requirements":
    "Your password does not meet this project's password policy.",
  "auth/network-request-failed":
    "Check your internet connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/operation-not-allowed":
    "Enable Email/Password sign-in in Firebase Authentication.",
  "auth/unauthorized-domain":
    "Add this domain to Firebase Authentication's authorized domains.",
};

let auth;
let authSdk;
let accountMode = REGISTER_MODE;
let isAuthenticating = false;
let pendingPassword = "";

function createFieldMarkup(fieldName, formPrefix) {
  const [label, placeholder, type, defaultAutocomplete] =
    FIELD_CONFIG[fieldName];
  const inputId = `${formPrefix}-${fieldName}`;
  const isPassword = fieldName === "password";
  const isLoginPassword =
    formPrefix === "account" && accountMode === LOGIN_MODE && isPassword;
  const autocomplete = isLoginPassword
    ? "current-password"
    : defaultAutocomplete;
  const inputClass = isPassword ? 'class="has-toggle"' : "";
  const mobileAttributes =
    fieldName === "mobile" ? 'inputmode="numeric" maxlength="10"' : "";
  const toggleButton = isPassword
    ? `<button type="button" class="toggle" data-target="${inputId}" aria-label="Show password">Show</button>`
    : "";
  const passwordHint =
    isPassword && formPrefix === "account" && accountMode === REGISTER_MODE
      ? '<p class="hint">At least 6 characters, including a letter and a number.</p>'
      : "";

  return `
    <div class="field">
      <label for="${inputId}">${label}</label>
      <div class="input-wrap">
        <input
          id="${inputId}"
          name="${fieldName}"
          type="${type}"
          autocomplete="${autocomplete}"
          placeholder="${placeholder}"
          required
          aria-describedby="${inputId}-error"
          ${inputClass}
          ${mobileAttributes}
        >
        ${toggleButton}
      </div>
      <p class="error" id="${inputId}-error"></p>
      ${passwordHint}
    </div>`;
}

function renderAccountForm() {
  const isRegisterMode = accountMode === REGISTER_MODE;

  getElement("register-name").innerHTML = isRegisterMode
    ? createFieldMarkup("name", "account")
    : "";
  getElement("account-fields").innerHTML = ["email", "password"]
    .map((fieldName) => createFieldMarkup(fieldName, "account"))
    .join("");
  getElement("account-title").textContent = isRegisterMode
    ? "Create your student account"
    : "Welcome back";
  getElement("account-subtitle").textContent = isRegisterMode
    ? "Enter your details to begin your student profile."
    : "Sign in to continue your Yugam profile.";
  getElement("account-submit").textContent = isRegisterMode
    ? "Create account →"
    : "Sign in →";
  getElement("switch-label").textContent = isRegisterMode
    ? "Already have an account?"
    : "New here?";
  getElement("switch-mode").textContent = isRegisterMode
    ? "Sign in"
    : "Create account";
}

function setStatus(message, isSuccess = false) {
  const statusElement = getElement("status");
  statusElement.textContent = message;
  statusElement.className = isSuccess ? "success" : "";
}

function validateFields(formPrefix, fieldNames, isRegistration = false) {
  let firstInvalidInput;

  for (const fieldName of fieldNames) {
    const input = getElement(`${formPrefix}-${fieldName}`);
    const isLoginPassword =
      formPrefix === "account" &&
      accountMode === LOGIN_MODE &&
      fieldName === "password";
    let errorMessage = isLoginPassword
      ? input.value
        ? ""
        : "This field is required."
      : validate(fieldName, input.value);

    if (
      isRegistration &&
      fieldName === "password" &&
      !errorMessage &&
      input.value.length < 6
    ) {
      errorMessage = "Firebase requires at least 6 characters.";
    }

    getElement(`${formPrefix}-${fieldName}-error`).textContent = errorMessage;
    input.setAttribute("aria-invalid", String(Boolean(errorMessage)));
    if (errorMessage && !firstInvalidInput) {
      firstInvalidInput = input;
    }
  }

  firstInvalidInput?.focus();
  return !firstInvalidInput;
}

function updateProgress(hasUser) {
  getElement("step1").classList.toggle("active", !hasUser);
  getElement("step2").classList.toggle("active", hasUser);

  if (hasUser) {
    getElement("step1").removeAttribute("aria-current");
    getElement("step2").setAttribute("aria-current", "step");
  } else {
    getElement("step1").setAttribute("aria-current", "step");
    getElement("step2").removeAttribute("aria-current");
  }
}

function renderUserView(user) {
  const hasUser = Boolean(user);

  getElement("account-view").hidden = hasUser;
  getElement("profile-view").hidden = !hasUser;
  updateProgress(hasUser);
  document.title = hasUser
    ? "Student Profile | Yugam International School"
    : "Student Registration | Yugam International School";

  if (!hasUser) {
    getElement("profile-form").reset();
    getElement("profile-fields").innerHTML = "";
    pendingPassword = "";
    return;
  }

  getElement("profile-fields").innerHTML = [
    "name",
    "password",
    "mobile",
    "username",
    "email",
  ]
    .map((fieldName) => createFieldMarkup(fieldName, "profile"))
    .join("");
  getElement("profile-name").value = user.displayName || "";
  getElement("profile-email").value = user.email || "";
  getElement("profile-password").value = pendingPassword;
  pendingPassword = "";
  getElement("account-form").reset();
  getElement("profile-name").focus();
}

function setAccountControlsDisabled(isDisabled) {
  getElement("account-submit").disabled = isDisabled;
  getElement("switch-mode").disabled = isDisabled;
}

document.addEventListener("click", (event) => {
  const toggleButton = event.target.closest(".toggle");
  if (!toggleButton) {
    return;
  }

  const input = getElement(toggleButton.dataset.target);
  const shouldShow = input.type === "password";
  input.type = shouldShow ? "text" : "password";
  toggleButton.textContent = shouldShow ? "Hide" : "Show";
  toggleButton.setAttribute(
    "aria-label",
    shouldShow ? "Hide password" : "Show password",
  );
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("input");
  if (!input) {
    return;
  }

  const errorElement = getElement(`${input.id}-error`);
  if (errorElement) {
    errorElement.textContent = "";
  }
  input.removeAttribute("aria-invalid");
});

getElement("switch-mode").addEventListener("click", () => {
  accountMode = accountMode === REGISTER_MODE ? LOGIN_MODE : REGISTER_MODE;
  setStatus("");
  renderAccountForm();
});

getElement("account-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isAuthenticating) {
    return;
  }

  setStatus("");
  const isRegisterMode = accountMode === REGISTER_MODE;
  const requiredFields = isRegisterMode
    ? ["name", "email", "password"]
    : ["email", "password"];

  if (!validateFields("account", requiredFields, isRegisterMode)) {
    return;
  }
  if (!auth) {
    setStatus("Connect your Firebase project using README.md first.");
    return;
  }

  const email = getElement("account-email").value;
  const password = getElement("account-password").value;
  const name = getElement("account-name")?.value;
  isAuthenticating = true;
  setAccountControlsDisabled(true);

  try {
    const result = isRegisterMode
      ? await authSdk.createUserWithEmailAndPassword(auth, email, password)
      : await authSdk.signInWithEmailAndPassword(auth, email, password);
    let warning = "";

    if (isRegisterMode) {
      try {
        await authSdk.updateProfile(result.user, { displayName: name });
      } catch {
        warning =
          "Account created, but your name could not be saved. Enter it below.";
      }
    }

    pendingPassword = password;
    renderUserView(result.user);
    if (name && !getElement("profile-name").value) {
      getElement("profile-name").value = name;
    }
    setStatus(warning);
  } catch (error) {
    pendingPassword = "";
    setStatus(
      AUTH_ERROR_MESSAGES[error.code] ||
        "Authentication failed. Check your Firebase settings and try again.",
    );
  } finally {
    isAuthenticating = false;
    setAccountControlsDisabled(false);
  }
});

getElement("profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!auth?.currentUser) {
    renderUserView(null);
    setStatus("Please sign in to continue.");
    return;
  }

  const isValid = validateFields("profile", [
    "name",
    "password",
    "mobile",
    "username",
    "email",
  ]);
  setStatus(
    isValid
      ? "All set! Every field passed validation."
      : "Check the highlighted fields and try again.",
    isValid,
  );
});

getElement("logout").addEventListener("click", async () => {
  const logoutButton = getElement("logout");
  logoutButton.disabled = true;

  try {
    await authSdk.signOut(auth);
    setStatus("You have been logged out.");
  } catch {
    setStatus("Could not log out. Try again.");
  } finally {
    logoutButton.disabled = false;
  }
});

async function initializeFirebase() {
  const hasPlaceholderConfig = Object.values(firebaseConfig).some((value) =>
    value.startsWith("REPLACE_"),
  );
  if (hasPlaceholderConfig) {
    getElement("setup").hidden = false;
    return;
  }

  try {
    const appSdk = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"
    );
    authSdk = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js"
    );
    auth = authSdk.getAuth(appSdk.initializeApp(firebaseConfig));
    await authSdk.setPersistence(auth, authSdk.browserSessionPersistence);
    authSdk.onAuthStateChanged(auth, (user) => {
      if (!isAuthenticating) {
        setStatus("");
        renderUserView(user);
      }
    });
  } catch {
    setStatus(
      "Firebase could not initialize. Check configuration and your connection.",
    );
  }
}

renderAccountForm();
initializeFirebase();
