# Animés · Tom  ·  アニメ

Appli perso (PWA) pour suivre mes animés sur iPhone, style « Néon Tokyo ».

- Recherche simultanée AniList + MyAnimeList (Jikan) + Kitsu, doublons fusionnés
- Fonds d'écran animés : bannières de ma liste, tendances AniList, un animé choisi ou ma propre photo
- 6 thèmes (Néon Tokyo, Sakura, Akatsuki, Shinigami, Mecha, Dynamique)
- Carrousel « Reprendre », +1 épisode, écran « 完走 Arc terminé »
- Gacha du soir pour choisir quoi regarder
- Notes en tier list S/A/B/C/D, favoris en cartes holo, journal en bulles de manga
- Fiche : bande-annonce, personnages, suites/préquelles, recommandations
- Simulcast de la semaine (jours en kanji), épisodes à rattraper
- Un animé suggéré pour chaque jour libre (simulcast du jour, backlog ou série à binger) selon mes notes et mes goûts
- Fenêtre de statut façon isekai : niveau, rang, classe, 16 succès

## Mise en ligne (GitHub Pages)

1. Créer un dépôt public (ex. `animes`) et y déposer tous les fichiers à la racine.
2. Settings > Pages > Source : `Deploy from a branch`, branche `main`, dossier `/ (root)`.
3. Attendre 1 à 2 minutes, l'appli est sur `https://<pseudo>.github.io/animes/`.

## Installation sur l'iPhone

1. Ouvrir l'adresse dans Safari.
2. Bouton Partager > « Sur l'écran d'accueil ».
3. Lancer l'appli depuis l'icône (plein écran, marche hors ligne pour la liste).

## Données

- Tout est stocké en local sur le téléphone (localStorage), rien n'est envoyé ailleurs.
- Réglages > Exporter : sauvegarde JSON à garder dans Fichiers / iCloud.
- Les APIs utilisées sont publiques et sans clé : AniList (GraphQL), Jikan v4, Kitsu.

## Mettre à jour l'appli

Remplacer les fichiers sur GitHub, puis changer `VERSION` dans `sw.js` (ex. `animes-v1.0.1`) pour forcer le téléphone à recharger la nouvelle version.
