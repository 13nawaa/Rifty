# Comptes Rifty — état du 29 septembre 2026

## Déjà configuré

- Projet Supabase **Rifty**, région Paris (`eu-west-3`), référence `yildqtltyqnhazufegro`.
- Clé publique publishable et URL du projet dans `auth-config.js`. Aucune clé secrète dans le site.
- Authentification par e-mail activée ; confirmation d’adresse obligatoire ; minimum de 8 caractères.
- Site URL et retour autorisé : `https://13nawaa.github.io/Rifty/`.
- Inscription, connexion, renvoi de confirmation, récupération du mot de passe et déconnexion dans `auth.js`.
- Profils, favoris et missions dans `rifty_user_data`, avec RLS limitée au propriétaire et droits explicites.
- Table et stockage du défi communautaire configurés ; les vidéos publiées sont publiques.
- SDK JavaScript fixé à `2.117.2`.
- Réglages du profil réunis dans une fenêtre accessible par la roue dentée ; les modifications sont appliquées avec « Enregistrer ».
- Pseudos réservés dans `rifty_handles`, uniques sans distinction majuscules/minuscules. 3 à 24 lettres ASCII, chiffres ou `_`. La base impose l’unicité et la propriété ; la communauté utilise le pseudo réservé.

## Étape restante : envoi des e-mails au public

**Le serveur SMTP de démonstration Supabase ne livre qu’aux adresses membres de l’organisation. Les inscriptions publiques et la récupération par e-mail ne sont donc pas encore prêtes pour tous les visiteurs.**

1. Choisir et ouvrir un compte chez un service SMTP (par exemple Brevo ou Resend).
2. Vérifier l’adresse d’expédition ou le domaine selon les exigences du fournisseur.
3. Saisir les paramètres SMTP directement dans Supabase : https://supabase.com/dashboard/project/yildqtltyqnhazufegro/auth/smtp . Ne jamais les ajouter au dépôt GitHub.
4. Tester une inscription avec une adresse extérieure à l’équipe, confirmer le compte, se déconnecter, se reconnecter, puis tester « Mot de passe oublié ».
5. Une fois ces tests réussis, passer `emailDeliveryReady` à `true` dans `auth-config.js` et republier le site pour retirer la mention de phase de test.

Documentation : https://supabase.com/docs/guides/auth/auth-smtp

## Google

Google OAuth est activé dans Supabase avec le client « Rifty Web ». L’origine est `https://13nawaa.github.io` et le callback est `https://yildqtltyqnhazufegro.supabase.co/auth/v1/callback`. Le secret reste uniquement dans Supabase et n’est jamais ajouté au dépôt. Le bouton Google est actif sur le site.

La connexion Google ne demande que l’identité de base (openid, email, profil), aucun accès à la boîte Gmail. Elle ne dépend pas de l’envoi SMTP Rifty. Un Gmail peut aussi servir d’adresse pour un mot de passe Rifty, sous réserve du service SMTP ci-dessus.

## Données et vérifications

Un profil cloud existant est restauré à la connexion. Les données invitées ne l’écrasent pas. Un nouveau compte sans profil cloud peut reprendre les données locales. Les caches de comptes sont séparés ; les modifications non synchronisées restent dans le cache du compte correspondant. Une déconnexion nettoie le profil affiché et les avis privés locaux.

Vérifications effectuées : scénarios de connexion simulés, récupération conservée lors d’un rafraîchissement de session, isolation de deux utilisateurs par RLS (transaction de test annulée), refus des lectures anonymes de profils, lecture publique du fil communautaire. Les tests des pseudos vérifient le doublon insensible à la casse, les droits du propriétaire, l’annulation des réglages et le changement de compte pendant un enregistrement. Aucune alerte de base de données ; Advisor signale la protection contre les mots de passe compromis désactivée, fonctionnalité réservée au forfait Pro : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Aucun abonnement payant n’a été activé. La livraison réelle d’e-mails et le parcours complet de confirmation restent à tester après configuration SMTP.

Utiliser le site HTTPS publié, pas une URL `file://`, pour les comptes et les liens de confirmation.
