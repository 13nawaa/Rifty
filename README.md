# Rifty — site statique

Cette version est prête à déposer à la racine d’un dépôt GitHub Pages. `index.html`, les scripts, les feuilles de style et les dossiers `assets/` et `avatars/` doivent rester ensemble. Aucun serveur applicatif, compte ni installation n’est nécessaire. Le site est publié sur https://13nawaa.github.io/Rifty/.

## Comptes et synchronisation

Rifty est relié au projet Supabase Rifty. La connexion Google est active. La connexion e-mail, la récupération du mot de passe et les données privées sont configurées ; l’envoi des e-mails au public attend encore un service SMTP : voir `AUTH_SETUP.md`. Les clés présentes dans `auth-config.js` sont publiques ; aucun secret serveur n’est ajouté au site.

## Personnalisation

- Logo : `assets/logo-custom.png`, affiché par `<img class="logo-custom">`. Le fichier fourni est utilisé sans modification. En mode sombre, le contraste est inversé par CSS pour conserver sa lisibilité.
- Profil : roue dentée sur la bannière pour modifier le pseudo, le niveau, la photo et la bannière dans une seule fenêtre. Le formulaire n’est plus affiché en permanence. Le pseudo doit être réservé avec un compte ; Supabase garantit son unicité sans distinguer les majuscules. `accord-profile` conserve le cache local. Images PNG/JPEG/WebP jusqu’à 8 Mo, redimensionnées avant sauvegarde.
- Créateurs enregistrés dans Mon Profil : `accord-favorites`. Ils alimentent aussi la statistique « créateurs suivis ».
- Missions : `accord-missions`, historique daté selon le jour local. 20 XP découverte, 50 XP pratique, 30 XP tutoriel. Nouveau rang tous les 200 XP. Décocher retire les XP de cette mission. Les jours précédents restent comptabilisés.
- Le niveau musical choisi est distinct du rang XP. Les badges se débloquent selon les actions indiquées dans le profil.
- En mode invité, ces données restent sur l’appareil et l’origine du site. Avec un compte, profil, favoris et missions sont synchronisés dans Supabase ; les avis privés et les rappels restent locaux.

## Icônes

Icônes d’interface : Lucide, licence ISC reproduite dans `assets/LUCIDE-LICENSE.txt`. Logos monochromes YouTube et TikTok : géométrie Simple Icons v15 (CC0), sans redessin ni déformation ; marques détenues par leurs propriétaires. Sources : https://github.com/simple-icons/simple-icons et https://lucide.dev. Les drapeaux signalent la langue du contenu, pas la nationalité.

Les recommandations et avis privés restent indépendants des plateformes.

## Patch du 29 septembre 2026

- Police de signature Damion embarquée pour le logo uniquement (licence SIL OFL dans assets/fonts/).
- Icônes recentrées, interactions légères et respect de la préférence système de réduction des animations.
- Bouton « Suggérer un créateur » intégré à la recherche ; les propositions restent locales.
- 17 créateurs, dont 11 francophones ; liens et sources dans CONTENT_SOURCES.md.
- 10 ressources de formation, avec niveaux conseillés, prérequis et filtre par niveau.
