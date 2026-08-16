/**
 * Génère MTN_API_USER + MTN_API_KEY (sandbox uniquement).
 *
 * Prérequis : avoir déjà MTN_SUBSCRIPTION_KEY (produit Disbursements)
 * sur https://momodeveloper.mtn.com
 *
 * Usage:
 *   node scripts/momo-sandbox-keys.mjs VOTRE_SUBSCRIPTION_KEY
 *   # ou
 *   set MTN_SUBSCRIPTION_KEY=... && node scripts/momo-sandbox-keys.mjs
 */

import { randomUUID } from "crypto";

const subscriptionKey =
  process.argv[2] || process.env.MTN_SUBSCRIPTION_KEY || "";

if (!subscriptionKey) {
  console.error(
    "Manque la Subscription Key.\nEx: node scripts/momo-sandbox-keys.mjs VOTRE_KEY",
  );
  process.exit(1);
}

const apiUser = randomUUID();
const base = "https://sandbox.momodeveloper.mtn.com";

async function main() {
  const createUser = await fetch(`${base}/v1_0/apiuser`, {
    method: "POST",
    headers: {
      "X-Reference-Id": apiUser,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      providerCallbackHost: "localhost",
    }),
  });

  if (createUser.status !== 201 && !createUser.ok) {
    console.error("Création API user échouée:", createUser.status);
    console.error(await createUser.text());
    process.exit(1);
  }

  const createKey = await fetch(`${base}/v1_0/apiuser/${apiUser}/apikey`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!createKey.ok) {
    console.error("Création API key échouée:", createKey.status);
    console.error(await createKey.text());
    process.exit(1);
  }

  const data = await createKey.json();
  const apiKey = data.apiKey;

  console.log("\n✅ Clés sandbox générées. Ajoute dans web/.env :\n");
  console.log(`MTN_SUBSCRIPTION_KEY="${subscriptionKey}"`);
  console.log(`MTN_API_USER="${apiUser}"`);
  console.log(`MTN_API_KEY="${apiKey}"`);
  console.log(`MTN_TARGET_ENV="sandbox"`);
  console.log(`MTN_CURRENCY="EUR"`);
  console.log(
    `MTN_BASE_URL="https://sandbox.momodeveloper.mtn.com/disbursement"`,
  );
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
