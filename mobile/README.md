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

## Parcours

| Écran | Fichier |
| --- | --- |
| Présentation (3 écrans) | `src/app/welcome.tsx` |
| Inscription (pays → identité → coordonnées) | `src/app/auth/signup.tsx` |
| Connexion / mot de passe oublié | `src/app/auth/login.tsx`, `forgot.tsx` |
| Vérification d'identité (document, selfie) | `src/app/kyc/index.tsx` |
| Accueil + simulateur | `src/app/(tabs)/index.tsx` |
| Envoyer · Historique · Services · Profil | `src/app/(tabs)/*` |
| Bénéficiaire → récapitulatif → paiement | `src/app/send/*` |
| Suivi en temps réel d'un transfert | `src/app/transfer/[id].tsx` |

Trajets ouverts : Canada ⇄ Cameroun ⇄ Chine (6 directions), devis en direct via `/api/quotes`.

## État actuel (à brancher avant la production)

- **Comptes** : stockés sur l'appareil (démo). À relier à Supabase Auth.
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
