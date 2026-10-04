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

## Écrans (61 de la maquette)

| Zone | Écrans | Dossier |
| --- | --- | --- |
| Accès | présentation (3), connexion, vérification en deux étapes, Face ID / empreinte, mot de passe oublié → courriel envoyé → nouveau mot de passe → succès, verrouillage par code PIN | `src/app/welcome.tsx`, `auth/`, `lock.tsx` |
| Inscription | 8 étapes : coordonnées, code SMS, identité, adresse, mot de passe, pièce d'identité, photo, selfie, puis « Compte créé » | `auth/signup.tsx`, `kyc/` |
| Transfert | accueil + simulateur, montant, destinataire (Mobile Money / banque / retrait), récapitulatif, paiement par carte, traitement, paiement réussi, suivi, reçu | `(tabs)/`, `send/`, `transfer/`, `receipt/` |
| Historique | recherche, filtres, export ; notifications | `(tabs)/history.tsx`, `notifications.tsx` |
| Destinataires | liste, fiche, ajout, modification | `recipients/` |
| PWFINTECH | Découvrir, Finances + rendez-vous (créneaux réels), Technologies + projet, Shipping + devis + suivi de colis | `(tabs)/discover.tsx`, `services/` |
| Compte | profil, informations, sécurité, mot de passe, appareils, moyens de paiement, ajout de carte, notifications, langue, parrainage, code PIN, aide, article, contact, documents légaux, déconnexion | `(tabs)/profile.tsx`, `account/`, `help/`, `legal.tsx` |

Les demandes de service (contact, devis Shipping, rendez-vous Finances, projet Technologies)
sont envoyées à l'API du site (`/api/requests`) et apparaissent dans l'admin.

## État actuel (à brancher avant la production)

- **Comptes** : stockés sur l'appareil (mot de passe et PIN hachés). À relier à Supabase Auth.
- **Codes SMS / courriel** (inscription, 2 étapes, mot de passe oublié) : simulés, aucun message envoyé.
- **Cartes** : seuls marque, 4 derniers chiffres et expiration sont gardés ; aucun débit en démo.
- **Langues** : français ; anglais, espagnol et chinois à venir.
- **KYC** : capture simulée. À remplacer par le SDK d'un prestataire KYC.
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
