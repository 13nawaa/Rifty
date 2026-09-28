# Activer les comptes Rifty

L’interface et la synchronisation sont déjà intégrées. Il reste à relier le site à un projet Supabase.

## 1. Créer le projet

Créez un projet sur `https://supabase.com`, puis ouvrez **Project Settings → API**.

Copiez dans `auth-config.js` :

- **Project URL** dans `url` ;
- **Publishable key** ou l’ancienne clé publique `anon` dans `publishableKey`.

Ces deux valeurs sont publiques et peuvent être utilisées dans un site web. Ne copiez jamais la clé `service_role` dans le site.

## 2. Activer la synchronisation

Dans **SQL Editor**, exécutez tout le contenu de `supabase-schema.sql`. Il crée les données privées du profil, la table du défi communautaire et le bucket des vidéos. Les règles Row Level Security garantissent que chaque utilisateur ne peut modifier que ses propres données et publier que dans son propre dossier.

## 3. Configurer les URL

Dans **Authentication → URL Configuration** :

- placez l’adresse GitHub Pages finale dans **Site URL** ;
- ajoutez la même adresse dans **Redirect URLs** ;
- ajoutez temporairement `http://127.0.0.1:4173/**` pour les tests locaux.

Vous pouvez aussi renseigner l’adresse finale dans `redirectUrl` de `auth-config.js`. Si elle reste vide, Rifty utilise automatiquement la page courante.

## 4. Connexion par e-mail

Dans **Authentication → Providers**, laissez **Email** activé. La confirmation de l’adresse est recommandée. Pour un site public, configurez ensuite un SMTP personnalisé afin d’assurer une bonne délivrabilité des e-mails.

## 5. Connexion Google

Dans Google Auth Platform, créez un client OAuth de type **Web application** :

- ajoutez l’origine de votre site GitHub Pages aux origines JavaScript autorisées ;
- ajoutez comme URI de redirection l’URL de callback affichée dans la page Google du tableau de bord Supabase, généralement `https://VOTRE_PROJECT_REF.supabase.co/auth/v1/callback`.

Copiez le Client ID et le Client Secret Google directement dans **Supabase → Authentication → Providers → Google**, puis activez le fournisseur. Le Client Secret Google ne doit jamais être ajouté aux fichiers du site.

## Fonctionnement des données

Le profil, les favoris, les missions et les XP locaux sont fusionnés avec le compte lors de la première connexion. Les changements suivants sont synchronisés automatiquement. À la déconnexion, les données personnelles synchronisées sont retirées de l’appareil et restent disponibles dans le compte.

Les rappels de pratique restent propres à chaque appareil. Les notifications système nécessitent le site publié en HTTPS et l’autorisation explicite du visiteur. Sans cette autorisation, Rifty affiche le rappel dans l’application lorsqu’elle est ouverte.

Le défi communautaire accepte une vidéo MP4, WebM ou MOV de 30 secondes et 25 Mo maximum. Une seule contribution est autorisée par compte et par défi hebdomadaire. Les vidéos, les pseudos et les légendes sont publics dans la section Communauté.
