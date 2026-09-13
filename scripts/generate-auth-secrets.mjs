import { randomBytes } from "node:crypto";

console.log("Generate these as private secret-manager values; do not commit them:");
console.log(`AUTH_PASSWORD_PEPPER=${randomBytes(48).toString("base64url")}`);
console.log(`AUTH_ENCRYPTION_KEY=${randomBytes(32).toString("base64url")}`);
