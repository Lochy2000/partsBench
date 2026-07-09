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

// Next.js expands $VARIABLE references in .env* files, and bcrypt hashes are full of
// `$`-delimited segments — escape every `$` as `\$` so Next doesn't try to substitute them.
// See "Referencing Other Variables": https://nextjs.org/docs/app/guides/environment-variables
const escapedHash = hash.replaceAll("$", "\\$");

console.log("\nAUTH_PASSWORD_HASH=" + escapedHash);
console.log(
  "\nCopy the line above into .env.local (replacing the existing AUTH_PASSWORD_HASH line).",
);
