# Yugam assignment

Mobile-first registration and profile validation with HTML, CSS, JavaScript and real Firebase Authentication. No application backend or build step.

## Firebase Authentication

Email/Password authentication must be enabled under Firebase Authentication > Sign-in method.

Project-specific Firebase configuration is supplied through environment variables and generated into `public/firebase-config.js` during the build. The generated file is ignored by Git. Use `.env.example` as the variable reference; never commit `.env` files, service-account JSON, admin credentials, or private keys.

Firebase web configuration is visible to browsers by design. Environment variables keep project-specific values out of source control, while Firebase Security Rules, App Check, authorized domains, and API-key restrictions provide the actual access controls.

For production, add the exact deployed hostname under Authentication > Settings > Authorized domains. The registration form enforces Firebase's default six-character password minimum.

## Local run

Set the variables from `.env.example` in your shell, then generate the local configuration:

    npm run build

Start the static server:

Windows:

    py -m http.server 3000 --directory public

macOS/Linux:

    python3 -m http.server 3000 --directory public

Open http://localhost:3000. Modules require HTTP; do not open index.html as a local file. The generated `public/firebase-config.js` remains untracked.

## Vercel deployment

Push this folder's contents to a GitHub repository and import it at https://vercel.com/new. Use the Other framework preset and `public` as the output directory. Add every variable from `.env.example` in Vercel Project Settings > Environment Variables. The build command is `npm run build`, as declared in `vercel.json`.

Deploy, then add the resulting hostname to Firebase Authorized domains and the API key's HTTP referrer restrictions.

Alternatively, with Node.js installed, run from this folder:

    npx vercel login
    npx vercel --prod

Select your account and create a project. Configure the Firebase environment variables before deploying.

## Behavior

- Registration creates a real Firebase account; name, email and password carry into the profile form.
- All profile fields are required.
- Name allows ASCII letters and single spaces between name parts.
- Password needs at least one alphabet and one number; registration also needs 6 characters.
- Mobile requires exactly 10 ASCII digits.
- Username requires letters, digits and exactly one non-whitespace special character. This explicitly interprets the assignment's ambiguous wording.
- Email uses a basic format check.
- Inline errors focus the first invalid input.
- Logout uses Firebase signOut; a sign-in form supports returning users.
- Password is retained only in memory for the immediate prefill, then cleared on logout. After refreshing, re-enter it: Firebase cannot return a password.
- Firebase browserSessionPersistence keeps the session across refreshes in the current browser session.
- Validate checks the form only; it does not update account credentials or persist mobile/username.

## Verification

Run the complete automated check:

    npm run check

Manual verification covers registration, duplicate-email handling, sign in, the prefilled profile step, every validation rule, session refresh and logout on desktop and mobile. Registration, sign in, profile prefilling and logout have been confirmed against the configured Firebase project.

The profile form intentionally validates client-side only, as required by the assignment. Mobile number and username are not persisted. Firebase never exposes a user's password; the app can prefill it only during the same registration or sign-in action, while it remains in memory.

Documentation:
https://firebase.google.com/docs/auth/web/password-auth
https://vercel.com/docs/deployments/overview
