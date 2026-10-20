# Vidéo de lancement WorldSoft Transfer

Projet Remotion des vidéos de présentation (9:16, 1080×1920, 30 i/s) en français et en anglais.

- Aperçu : `npm i && npx remotion studio`
- Rendu : `npx remotion render LaunchFR out/lancement-fr.mp4` et `npx remotion render LaunchEN out/lancement-en.mp4`

Contenu :
- `src/copy.ts` : textes, début de chaque scène calé sur la voix off.
- `public/audio/vo-*.mp3` : voix off ElevenLabs. `music.mp3` : musique originale générée par `scripts/make-music.py`.
- `public/screens/` : captures de l'appli avec des données d'exemple (`scripts/capture-app.cjs`).
