import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

writeFileSync("private.pem", privateKey);
writeFileSync("public.pem", publicKey);

console.log("Wrote private.pem and public.pem");
