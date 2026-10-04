# PWFINTECH (Paul World Finances and Technologies) — Transfert Canada → Cameroun (web)

Application web de transfert d'argent (MVP démo) :

- **Collecte Canada** : mock (bouton simuler) ou **Stripe Checkout** test
- **Payout Cameroun** : mock MoMo ou **MTN MoMo Disbursement** API
- Parcours auto : paiement détecté → payout → livré

## Démarrage rapide

```bash
cd web
npm install
npx prisma migrate dev --name init
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

### Parcours démo

1. Accueil → calcule un devis CAD → XAF
2. **Envoyer** → crée un transfert
3. Sur la page transfert → **Simuler le paiement**
4. Le payout MoMo mock part automatiquement → statut **Livré**

## Configuration

Copie `.env.example` vers `.env` (déjà présent).

| Variable | Rôle |
|----------|------|
| `QUOTE_RATE` | Fallback CAD→XAF si APIs FX down |
| `FX_MARGIN_PERCENT` | Marge sur le taux marché (ex: 1.5) |
| `QUOTE_FEE_CAD` | Frais fixes |
| `STRIPE_SECRET_KEY` | Active Stripe au lieu du mock |
| `MTN_*` | Active MoMo réel au lieu du mock |
| `AUTO_PAYOUT` | `true` = payout auto après paiement |

Sans clés Stripe/MoMo, tout tourne en **mock** (idéal pour développer).

## Comptes clients et backoffice

L'application mobile WorldSoft Transfer utilise de vrais comptes stockés dans la base (tables `Customer`
et `CustomerSession`). À faire une fois dans Supabase › SQL Editor :

```
prisma/migrations-manual/2026-10-04-customers.sql
```

Le script crée les tables et un **compte de démonstration** (identité déjà vérifiée) :

| Courriel | Mot de passe |
| --- | --- |
| `demo@pwfintech.test` | `Demo2026!` |

À supprimer avant l'ouverture au public : `DELETE FROM "Customer" WHERE "email" = 'demo@pwfintech.test';`

API de l'appli : `POST /api/auth/signup|login|logout|password-reset`, `GET|PATCH|DELETE /api/me`,
`POST /api/me/password`, `POST /api/me/kyc`, `GET /api/me/transfers`, `GET|DELETE /api/me/sessions`.
Jeton en `Authorization: Bearer …` (seule son empreinte SHA-256 est stockée), mot de passe haché avec scrypt.
Un client connecté ne peut envoyer qu'une fois son identité vérifiée.

Backoffice `/admin/clients` (même mot de passe que l'admin) :
- créer un compte client (mot de passe choisi ou temporaire) ;
- valider / refuser une identité (motif visible par le client), redemander les documents ;
- suspendre / réactiver un compte (déconnexion immédiate de tous ses appareils) ;
- générer un mot de passe temporaire (demandes « mot de passe oublié » reçues dans `/admin/demandes`) ;
- voir et déconnecter les appareils, consulter les transferts du client, note interne, suppression.

## Architecture

```
src/lib/quote.ts              moteur de devis
src/lib/transfer-machine.ts   états du transfert
src/lib/transfer-service.ts   paiement → payout
src/lib/providers/            stripe | mock | momo | mock_momo
src/app/api/                  quotes, transfers, webhooks
```

## MoMo Disbursement (ton fichier OpenAPI)

Spec copiée dans `docs/momo-disbursement.openapi.json`.

Endpoints utilisés :
- `POST /token/` — access token
- `POST /v1_0/transfer` — payout (X-Reference-Id UUID + X-Callback-Url)
- `GET /v1_0/transfer/{referenceId}` — statut
- `GET /v1_0/account/balance` — float
- Callback app : `POST /api/webhooks/momo`

Dans `.env`, renseigne `MTN_SUBSCRIPTION_KEY`, `MTN_API_USER`, `MTN_API_KEY`.
Sandbox : `MTN_CURRENCY=EUR`. Live Cameroun : `MTN_CURRENCY=XAF`.
