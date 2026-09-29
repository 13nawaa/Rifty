# Rifty — site statique

Cette version est prête à déposer à la racine d’un dépôt GitHub Pages. `index.html`, les scripts, les feuilles de style et les dossiers `assets/` et `avatars/` doivent rester ensemble. Aucun serveur applicatif, compte ni installation n’est nécessaire. La publication reste à votre charge.

## Comptes et synchronisation

Rifty intègre la création de compte par Google ou par e-mail et mot de passe avec Supabase Auth. Suivez `AUTH_SETUP.md`, renseignez les deux valeurs publiques dans `auth-config.js`, puis exécutez `supabase-schema.sql` dans le projet Supabase. Ce schéma active aussi le défi communautaire et le stockage protégé des vidéos. Sans cette configuration, le site reste utilisable en mode local et indique clairement que la connexion doit être activée.

## Personnalisation

- Logo : `assets/logo-custom.png`, affiché par `<img class="logo-custom">`. Le fichier fourni est utilisé sans modification. En mode sombre, le contraste est inversé par CSS pour conserver sa lisibilité.
- Profil : pseudo, niveau musical, photo et bannière enregistrés dans `accord-profile` sur le navigateur. Cette clé historique est conservée pour ne pas perdre les données créées avant le rebranding Rifty. Images PNG/JPEG/WebP jusqu’à 8 Mo, redimensionnées avant sauvegarde.
- Créateurs enregistrés dans Mon Profil : `accord-favorites`. Ils alimentent aussi la statistique « créateurs suivis ».
- Missions : `accord-missions`, historique daté selon le jour local. 20 XP découverte, 50 XP pratique, 30 XP tutoriel. Nouveau rang tous les 200 XP. Décocher retire les XP de cette mission. Les jours précédents restent comptabilisés.
- Le niveau musical choisi est distinct du rang XP. Les badges se débloquent selon les actions indiquées dans le profil.
- Ces données restent sur l’appareil et l’origine du site. Elles ne migrent pas automatiquement entre localhost, l’ancien hébergement et GitHub Pages.

## Icônes

Icônes d’interface : Lucide, licence ISC reproduite dans `assets/LUCIDE-LICENSE.txt`. Logos monochromes YouTube et TikTok : géométrie Simple Icons v15 (CC0), sans redessin ni déformation ; marques détenues par leurs propriétaires. Sources : https://github.com/simple-icons/simple-icons et https://lucide.dev. Les drapeaux signalent la langue du contenu, pas la nationalité.

Les recommandations et avis privés restent indépendants des plateformes.

## Patch du 29 septembre 2026

- Police de signature Damion embarquée pour le logo uniquement (licence SIL OFL dans assets/fonts/).
- Icônes recentrées, interactions légères et respect de la préférence système de réduction des animations.
- Bouton « Suggérer un créateur » intégré à la recherche ; les propositions restent locales.
- 17 créateurs, dont 11 francophones ; liens et sources dans CONTENT_SOURCES.md.
- 10 ressources de formation, avec niveaux conseillés, prérequis et filtre par niveau.
