# Tests Sandbox Orange Money

Script des scénarios T01 à T10 du guide d'intégration Orange Money (section 14.1). Il produit le
« cahier de résultats » demandé par Orange (`out/cahier-tests-orange-money-<date>.xlsx` et `.md`).
Aucun secret ni jeton n'est écrit dans le cahier.

1. Créer un compte sur https://apistore.orange.cm/devportal/home, créer une application,
   la souscrire à **OrangeMoneyCoreAPIS** et générer les clés **Sandbox**.
2. Renseigner les variables d'environnement (jamais dans le code) :
   `OM_CONSUMER_KEY`, `OM_CONSUMER_SECRET`, `OM_X_AUTH_TOKEN`, `OM_CHANNEL_MSISDN`, `OM_PIN`
   (et facultativement `OM_TEST_SUBSCRIBER` — par défaut 691441952, le numéro client des exemples du guide Orange —, `OM_FAIL_WAIT`).
3. Lancer : `python3 scripts/orange/orange_sandbox_test.py`

Le serveur du jeton (`apistore.orange.cm`) n'envoie pas son certificat intermédiaire : le fichier
`digicert-global-g2-tls-rsa-sha256-2020-ca1.crt` (certificat public DigiCert) complète la chaîne,
sans désactiver la vérification TLS.
