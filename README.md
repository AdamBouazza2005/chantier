# Chantier · BOUAZZA IMMO

Application de suivi de chantier pour le chef de chantier. Très simple, grands boutons, fonctionne sans réseau.

- **Accueil** : avancement global et par niveau, nombre de problèmes, bouton **Envoyer le point** (résumé du jour sur WhatsApp).
- **Niveau** : plan d’architecte du niveau ; chaque appartement est coloré (gris pas commencé, orange en cours, vert terminé, pastille rouge s’il y a un problème). Touchez un appartement pour l’ouvrir.
- **Appartement** :
  - le plan en grand, touchez-le pour zoomer ;
  - **Photo** : prend une photo avec l’appareil, datée et rangée dans l’appartement ;
  - **Problème** : signaler un défaut avec une photo, puis le marquer « Réglé » ;
  - **Travaux** : liste des étapes (gros œuvre, cloisons, électricité, plomberie… nettoyage) ; un toucher fait passer d’« Pas commencé » à « En cours » puis « Terminé » ;
  - **Dimensions** : surface et dimensions de chaque pièce, lues sur les plans.
- **Réglages** (roue dentée) : nom du chantier, liste des étapes, sauvegarde avec photos, import.

Les données restent sur le téléphone. Exportez une sauvegarde chaque semaine depuis les Réglages.

## Mise en ligne (GitHub Pages)

1. Créez un nouveau dépôt GitHub, par exemple `chantier`.
2. **Add file → Upload files** : envoyez le **contenu** de ce dossier (pas le zip). `index.html` doit être à la racine du dépôt.
3. **Settings → Pages** : *Deploy from a branch*, branche **main**, dossier **/ (root)**, **Save**.
4. L’adresse apparaît après une minute : `https://votre-nom.github.io/chantier/`.

## Installer sur le téléphone du chef de chantier

- **Android (Chrome)** : ouvrir l’adresse, menu **⋮**, **Installer l’application**.
- **iPhone (Safari)** : ouvrir l’adresse, **Partager**, **Sur l’écran d’accueil**.

Ouvrez l’application une première fois avec du réseau : ensuite elle fonctionne aussi sans connexion sur le chantier.

## Mise à jour

Remplacez les fichiers sur GitHub et changez le numéro dans `sw.js` (`chantier-v1.0.0` → `chantier-v1.0.1`). Les données du téléphone ne sont pas touchées.
