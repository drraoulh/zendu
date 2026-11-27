# Fiche App Store — WorldSoft Transfer

À coller dans App Store Connect > Apps > WorldSoft Transfer > Version 1.0 (langue : Français (Canada)).

## Informations de l'app
- Nom (30 car. max) : `WorldSoft Transfer`
- Sous-titre (30 car. max) : `Envoyez de l'argent facilement`
- Catégorie principale : Finance — secondaire : Style de vie (facultatif)
- Bundle ID : `com.pwfintech.worldsoft` — SKU : `worldsoft-transfer-ios`
- Classification d'âge : 4+ (aucun contenu sensible) ; répondre « Non » à tout, sauf « Transactions financières » = Oui.
- Prix : gratuit.
- Droits d'auteur : `2026 Paul World Finances and Technologies Ltd.`
- Contact support : support@worldsofttransfer.com — +1 416 830 3459
- URL d'assistance : https://worldsofttransfer.com
- URL de confidentialité : https://worldsofttransfer.com/confidentialite
- Conditions : https://worldsofttransfer.com/conditions

## Texte promotionnel (170 car. max)
Envoyez de l'argent du Canada vers le Cameroun et la Chine en quelques minutes. Taux affiché avant de payer, suivi de chaque envoi dans l'appli.

## Description
WorldSoft Transfer vous permet d'envoyer de l'argent depuis le Canada vers vos proches au Cameroun et en Chine, simplement et en toute transparence.

Comment ça marche
1. Créez votre compte en quelques instants.
2. Vérifiez votre identité depuis l'appli (pièce d'identité et selfie).
3. Choisissez le pays, le montant et le bénéficiaire. Le taux de change et les frais sont affichés avant que vous payiez.
4. Payez par virement Interac. Votre proche reçoit l'argent sur son compte ou son portefeuille mobile.

Ce que vous trouverez dans l'appli
- Le montant exact reçu par votre proche, calculé avant le paiement
- Le suivi de chaque envoi, étape par étape, avec notifications
- Vos bénéficiaires enregistrés pour renvoyer en deux touches
- Des reçus à partager ou à conserver
- Une connexion sécurisée : mot de passe, code de vérification, verrouillage par code PIN ou biométrie

Sécurité et conformité
WorldSoft Transfer est exploité par Paul World Finances and Technologies Ltd. L'identité des clients est vérifiée avant tout envoi, conformément à la réglementation canadienne. Vos données sont chiffrées et ne sont jamais vendues.

Besoin d'aide ? support@worldsofttransfer.com

## Mots-clés (100 car. max, séparés par des virgules, sans espaces)
`transfert,argent,Cameroun,Chine,Canada,envoi,Interac,remise,diaspora,mobile money,change`

## Notes pour la revue Apple
WorldSoft Transfer is a money transfer app (Canada to Cameroon and China). Customers pay in CAD by Interac e-Transfer and recipients are paid out to bank accounts or mobile wallets. Identity (KYC) is verified through Didit before the first transfer.

Test account (sign-in requires password + 6-digit code; the code below is fixed for this account only):
- Email: [À REMPLIR : courriel du compte de test]
- Password: [À REMPLIR]
- Verification code at login: [À REMPLIR : valeur de REVIEW_ACCOUNT_CODE]

Notes:
- The app is operated by Paul World Finances and Technologies Ltd., a Canadian company. Transfers are paid out manually by our operations team after payment is confirmed.
- No in-app purchases and no digital goods: payments are for real-world money transfers.
- Camera is used for ID and selfie verification (Didit) and card scanning. Location helps prevent fraud during verification.

## Confidentialité des données (questionnaire « App Privacy »)
Collectées et liées à l'utilisateur, pour fonctionnalités de l'app, jamais pour la publicité ni le pistage :
- Coordonnées : nom, courriel, téléphone, adresse
- Informations financières : informations de paiement, historique des transactions
- Identifiants : ID utilisateur, ID d'appareil (notifications)
- Contenu utilisateur : photos (pièce d'identité, selfie) pour la vérification
- Données sensibles/biométriques traitées par le prestataire de vérification d'identité (Didit)
- Position approximative : prévention de la fraude
Pistage (tracking) : **Non**.

## Conformité exportation
« Utilise le chiffrement » : Oui, chiffrement standard (HTTPS) uniquement → exempté (`ITSAppUsesNonExemptEncryption` = false déjà réglé dans l'appli).

## Captures d'écran requises
iPhone 6,9" (1320×2868) : 3 à 10 captures — accueil, nouveau transfert (taux affiché), paiement Interac, suivi de l'envoi, bénéficiaires.
Pas d'iPad (l'appli est réglée iPhone seulement).

## Avant de soumettre — à faire
- [ ] Définir REVIEW_ACCOUNT_EMAIL et REVIEW_ACCOUNT_CODE dans Vercel et créer ce compte de test (et passer son KYC en « vérifié »).
- [ ] Faire le build iOS (quota EAS à partir du 1er décembre) : `eas build -p ios --profile production`, puis `eas submit -p ios`.
- [ ] Tester sur TestFlight, puis « Ajouter pour examen ».
