// Captures d'écran de la vraie appli (version web exportée par Expo) avec des données de démonstration.
// Usage : node scripts/capture-app.cjs <dossier export web> <dossier de sortie>
// L'API est simulée : aucune donnée réelle, aucun appel au serveur de production.
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const [, , webDir, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });

// Petit serveur statique (repli sur index.html pour les routes de l'appli).
const server = http
  .createServer((q, r) => {
    let p = path.join(webDir, decodeURIComponent(q.url.split("?")[0]));
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(webDir, "index.html");
    const types = { ".js": "application/javascript", ".html": "text/html", ".css": "text/css", ".png": "image/png", ".ttf": "font/ttf", ".json": "application/json" };
    r.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(r);
  })
  .listen(8123);

const RATE = 403.85;
const now = Date.now();
const iso = (minAgo) => new Date(now - minAgo * 60_000).toISOString();

const profile = {
  id: "demo-paul",
  email: "paul.mbarga@exemple.com",
  phone: "+14165550142",
  firstName: "Paul",
  lastName: "Mbarga",
  country: "CA",
  region: "Ontario",
  kyc: "verified",
  kycProvider: "didit",
  kycVerifiedAt: iso(60 * 24 * 3),
  mustChangePassword: false,
  createdAt: iso(60 * 24 * 10),
};

const recipients = [
  { id: "r1", fullName: "Marie Ngono", phone: "+237670000000", network: "MTN", country: "CM", relation: "Mère" },
  { id: "r2", fullName: "Jean Fotso", phone: "+237690000000", network: "ORANGE", country: "CM", relation: "Frère" },
  { id: "r3", fullName: "Aïcha Bello", phone: "+237650000000", network: "MTN", country: "CM" },
  { id: "r4", fullName: "Li Wei", phone: "+8613812345678", network: "ALIPAY", country: "CN" },
];

function transfer(id, ref, name, phone, network, cad, status, minAgo, events, receive) {
  return {
    id,
    reference: ref,
    status,
    corridorId: "CA-CM",
    sourceCountry: "CA",
    destCountry: "CM",
    sendCurrency: "CAD",
    receiveCurrency: "XAF",
    senderName: "Paul Mbarga",
    senderEmail: profile.email,
    sendAmountCad: cad,
    receiveAmountXaf: receive ?? Math.round(cad * RATE),
    rate: RATE,
    feeCad: 0,
    totalCad: cad,
    payInProvider: "interac_manual",
    createdAt: iso(minAgo),
    beneficiary: { id: `b-${id}`, fullName: name, phone, network, country: "CM" },
    events,
    interac:
      status === "awaiting_payment"
        ? { email: "virement@exemple.com", name: "WorldSoft Transfer", amount: cad, currency: "CAD", message: ref, expiresAt: new Date(now + 48 * 3600_000).toISOString(), simulate: false }
        : undefined,
  };
}

const delivered = transfer("t-marie", "PW-7K3M9Q", "Marie Ngono", "+237670000000", "MTN", 200, "delivered", 9, [
  { id: "e1", type: "created", message: "Transfert créé", createdAt: iso(9) },
  { id: "e2", type: "payment_detected", message: "Virement Interac reçu", createdAt: iso(6) },
  { id: "e3", type: "payout_sent", message: "Versement MTN MoMo envoyé", createdAt: iso(5) },
  { id: "e4", type: "delivered", message: "Livré à Marie Ngono", createdAt: iso(3) },
]);
const others = [
  transfer("t-jean", "PW-4D8R2L", "Jean Fotso", "+237690000000", "ORANGE", 150, "delivered", 60 * 26, []),
  transfer("t-aicha", "PW-9X2B7N", "Aïcha Bello", "+237650000000", "MTN", 80, "delivered", 60 * 24 * 4, []),
];
const pending = transfer("t-new", "PW-5H6T1C", "Marie Ngono", "+237670000000", "MTN", 247.62, "awaiting_payment", 0, [
  { id: "n1", type: "created", message: "Transfert créé", createdAt: iso(0) },
], 100000);

function quote(body) {
  const send = body.receiveAmount ? Math.ceil((body.receiveAmount / RATE) * 100) / 100 : body.sendAmount ?? 200;
  const receive = body.receiveAmount ?? Math.round(send * RATE);
  return {
    corridorId: body.corridorId ?? "CA-CM",
    sourceCountry: "CA",
    destCountry: "CM",
    sendCurrency: "CAD",
    receiveCurrency: "XAF",
    sendAmount: send,
    receiveAmount: receive,
    rate: RATE,
    fee: 0,
    total: send,
    deliveryEstimate: "A few minutes",
    expiresAt: new Date(now + 15 * 60_000).toISOString(),
    fx: { fetchedAt: new Date(Date.now() - 20_000).toISOString() },
  };
}

const corridors = JSON.parse(fs.readFileSync(path.join(__dirname, "corridors.json"), "utf8"));

async function mockApi(page) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const json = (data, status = 200) =>
      route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: JSON.stringify(data) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (p === "/api/me") return json({ customer: profile });
    if (p === "/api/me/transfers") return json([delivered, ...others]);
    if (p === "/api/quotes" && url.searchParams.get("meta") === "corridors") return json(corridors);
    if (p === "/api/quotes") return json(quote(JSON.parse(req.postData() || "{}")));
    if (p === "/api/transfers" && req.method() === "POST") return json({ transfer: pending, payIn: { provider: "interac", sessionId: "s1", interac: pending.interac } });
    if (p === `/api/transfers/${pending.id}`) return json(pending);
    if (p.startsWith("/api/transfers/")) return json(delivered);
    return json({ ok: true });
  });
}

async function shot(page, name) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log("capture", name);
}

(async () => {
  const browser = await chromium.launch();
  for (const lang of ["fr", "en"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: lang === "fr" ? "fr-CA" : "en-CA" });
    // Compte de démonstration déjà connecté (stockage local de la version web de l'appli).
    await ctx.addInitScript(
      ({ lang, profile, recipients }) => {
        localStorage.setItem("wst.settings", JSON.stringify({ language: lang, twoFactor: true, biometric: false, pin: false, notifications: { push: false } }));
        localStorage.setItem("wst.token", JSON.stringify("demo-token"));
        localStorage.setItem("wst.profile", JSON.stringify(profile));
        localStorage.setItem("wst.onboarded", JSON.stringify(true));
        localStorage.setItem("wst.recipients", JSON.stringify(recipients));
      },
      { lang, profile, recipients },
    );
    const page = await ctx.newPage();
    page.on("pageerror", (e) => console.log(lang, "erreur page :", e.message));
    await mockApi(page);
    const out = (n) => `${lang}-${n}`;

    // 1. Accueil : simulateur, proches, activité.
    await page.goto("http://localhost:8123/", { waitUntil: "networkidle" });
    await shot(page, out("home"));

    // 2. Montant reçu imposé (« il reçoit 100 000 FCFA »).
    const inputs = page.locator("input");
    await inputs.nth(1).fill("100000");
    await page.waitForTimeout(900);
    await shot(page, out("receive"));

    // 3. Destinataire choisi sur l'accueil, puis récapitulatif.
    await page.getByText("Marie", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: lang === "fr" ? /Envoyer à Marie/ : /Send to Marie/ }).first().click();
    await page.waitForTimeout(1200);
    await shot(page, out("review"));

    // 4. Paiement : instructions du virement Interac.
    await page.getByRole("button", { name: /Interac/ }).last().click();
    await page.waitForTimeout(2500);
    await shot(page, out("interac"));

    // 5. Suivi : transfert livré.
    await page.goto(`http://localhost:8123/transfer/${delivered.id}`, { waitUntil: "networkidle" });
    await shot(page, out("tracking"));

    // 6. Reçu.
    await page.goto(`http://localhost:8123/receipt/${delivered.id}`, { waitUntil: "networkidle" });
    await shot(page, out("receipt"));

    // 7. Langues.
    await page.goto("http://localhost:8123/account/language", { waitUntil: "networkidle" });
    await shot(page, out("language"));

    // 8. Nouveau destinataire (contacts, réseaux).
    await page.goto("http://localhost:8123/recipients/new", { waitUntil: "networkidle" });
    await shot(page, out("recipient"));

    await ctx.close();
  }
  await browser.close();
  server.close();
})();
