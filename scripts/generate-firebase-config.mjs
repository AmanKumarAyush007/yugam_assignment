import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

const ENVIRONMENT_KEYS = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID",
  measurementId: "FIREBASE_MEASUREMENT_ID",
};

const requiredKeys = Object.values(ENVIRONMENT_KEYS).filter(
  (key) => key !== "FIREBASE_MEASUREMENT_ID",
);
const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim());

if (missingKeys.length > 0) {
  console.error(
    `Missing required Firebase environment variables: ${missingKeys.join(", ")}`,
  );
  process.exit(1);
}

const firebaseConfig = Object.fromEntries(
  Object.entries(ENVIRONMENT_KEYS)
    .filter(([, environmentKey]) => process.env[environmentKey]?.trim())
    .map(([configKey, environmentKey]) => [
      configKey,
      process.env[environmentKey].trim(),
    ]),
);

const output = `// Generated at build time. Do not edit or commit this file.\nexport const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};\n`;
const outputPath = fileURLToPath(
  new URL("../public/firebase-config.js", import.meta.url),
);

await writeFile(outputPath, output, "utf8");
console.log("Generated public/firebase-config.js from environment variables.");
