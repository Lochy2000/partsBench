// Prompts for a password (masked, typed twice to catch typos) and prints its bcrypt hash.
// Run with: npm run auth:hash-password
// Paste the printed hash into .env.local as AUTH_PASSWORD_HASH — never the plaintext password.
import bcrypt from "bcryptjs";
import prompts from "prompts";

const { password } = await prompts({
  type: "password",
  name: "password",
  message: "Password to hash",
});

if (!password) {
  console.error("No password entered.");
  process.exit(1);
}

const { confirm } = await prompts({
  type: "password",
  name: "confirm",
  message: "Confirm password",
});

if (password !== confirm) {
  console.error("Passwords did not match — run this again.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

// Next.js expands $VARIABLE references when loading *.env files*, and bcrypt hashes are full
// of `$`-delimited segments — unescaped, Next silently corrupts the value on load. That
// expansion is specific to Next's own .env-file parser, though: dashboards like Vercel's
// inject env vars directly into process.env with no such step, so the escaped form is
// actively wrong there (the backslashes become literal characters in the stored value).
// See "Referencing Other Variables": https://nextjs.org/docs/app/guides/environment-variables
const escapedHash = hash.replaceAll("$", "\\$");

console.log("\nFor .env.local / .env.test (Next.js reads these as .env files):");
console.log("AUTH_PASSWORD_HASH=" + escapedHash);

console.log("\nFor Vercel (or any dashboard that sets env vars directly, no .env parsing):");
console.log(hash);

console.log(
  "\nUse whichever matches where you're pasting it — mixing them up is why a password that " +
    "works locally can fail once deployed (or vice versa).",
);
