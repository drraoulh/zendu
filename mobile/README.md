# WorldSoft Transfer — application mobile (iOS · Android)

Application de transfert d'argent **WorldSoft Transfer**, une solution **PWFINTECH**.
Expo SDK 57 · Expo Router · React Native · TypeScript. Elle utilise l'API du site (`../web`).

## Démarrer

```bash
cd mobile
npm install
cp .env.example .env.local      # régler EXPO_PUBLIC_API_URL
npx expo start                  # i = iOS, a = Android, w = web
```

Sur téléphone, l'API doit être joignable depuis l'appareil : utilisez l'URL Vercel
(ou l'IP locale de votre machine), pas `localhost`.

Côté serveur (`web/`), autorisez l'origine de l'app web dans `MOBILE_CORS_ORIGINS`
(inutile pour les apps natives iOS/Android, qui ne sont pas soumises au CORS).

## Écrans

| Zone | Écrans | Dossier |
| --- | --- | --- |
| Accès | présentation (3), connexion, vérification en deux étapes, Face ID / empreinte, mot de passe oublié → courriel envoyé → nouveau mot de passe → succès, verrouillage par code PIN | `src/app/welcome.tsx`, `auth/`, `lock.tsx` |
| Inscription | 8 étapes : coordonnées, code SMS, identité, adresse, mot de passe, pièce d'identité, photo, selfie, puis « Compte créé » | `auth/signup.tsx`, `kyc/` |
| Transfert | accueil + simulateur, montant, destinataire (Mobile Money / banque / retrait), récapitulatif, paiement par carte, traitement, paiement réussi, suivi, reçu | `(tabs)/`, `send/`, `transfer/`, `receipt/` |
| Historique | recherche, filtres, export ; notifications | `(tabs)/history.tsx`, `notifications.tsx` |
| Destinataires | liste, fiche, ajout, modification | `recipients/` |
| Colis | suivi d'un envoi par son numéro PWS-… (onglet Colis), recherches récentes | `(tabs)/parcels.tsx` |
| Compte | profil, informations, sécurité, mot de passe, appareils, moyens de paiement, ajout de carte, notifications, langue, parrainage, code PIN, aide, article, contact, documents légaux, déconnexion | `(tabs)/profile.tsx`, `account/`, `help/`, `legal.tsx` |

L'appli se limite au **transfert d'argent** et au **suivi de colis**. Les services Finances,
Technologies et les demandes d'expédition restent sur le site PWFINTECH. Les messages envoyés
depuis « Nous contacter » arrivent dans l'admin (`/admin/demandes`).

## État actuel (à brancher avant la production)

- **Comptes** : sur le serveur (`/api/auth`, `/api/me`), gérés dans le backoffice `/admin/clients`.
  Compte de démo : `demo@pwfintech.test` / `Demo2026!` (voir `web/README.md`). L'appareil ne garde que
  le jeton de session (Keychain / Keystore), les réglages et le code PIN haché.
- **Codes SMS** (inscription, vérification en deux étapes) : simulés, aucun SMS envoyé.
- **Mot de passe oublié** : la demande arrive dans `/admin/demandes` ; l'équipe génère un mot de passe
  temporaire dans la fiche client, que le client remplace à sa connexion.
- **KYC** : la capture photo est simulée ; l'identité est validée par l'équipe (ou automatiquement avec
  `KYC_AUTO_APPROVE=true` côté serveur).
- **Cartes** : seuls marque, 4 derniers chiffres et expiration sont gardés ; aucun débit en démo.
- **Langues** : français ; anglais, espagnol et chinois à venir.
- **Paiement** : mode démo (bouton « Simuler le paiement ») ; si `STRIPE_SECRET_KEY` est défini
  côté serveur, l'app ouvre la page de paiement Stripe.
- **Versements** Interac, Alipay et WeChat Pay : non intégrés (MTN/Orange via MoMo côté serveur).

## Publier sur les stores

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios      # compte Apple Developer requis
npx eas-cli@latest submit --platform android  # compte Google Play Console requis
```

Identifiant d'application provisoire : `com.pwfintech.worldsoft` (`app.json`) — à confirmer
avant la première publication, il ne pourra plus être changé ensuite.

## Vérifications

```bash
npm run typecheck
npm run lint
```
