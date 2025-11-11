# Guide de configuration Supabase

## Étape 1 : Créer un compte Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Créez un compte (avec GitHub, Google, ou email)

## Étape 2 : Créer un nouveau projet

1. Une fois connecté, cliquez sur "New Project"
2. Choisissez un nom pour votre projet (ex: "tage-mage-trainer")
3. Créez un mot de passe de base de données (**IMPORTANT : Notez-le !**)
4. Choisissez une région proche de vous (ex: "Europe (Frankfurt)")
5. Cliquez sur "Create new project"

⏱️ Le projet prendra 2-3 minutes à se créer.

## Étape 3 : Exécuter le schéma SQL

1. Une fois le projet créé, cliquez sur l'icône "SQL Editor" dans le menu de gauche
2. Cliquez sur "New query"
3. Copiez **tout** le contenu du fichier `supabase/schema.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur "Run" (ou Ctrl+Enter)

✅ Vous devriez voir "Success. No rows returned" - c'est normal !

## Étape 4 : Récupérer les clés API

1. Cliquez sur l'icône "Settings" (roue dentée) en bas à gauche
2. Cliquez sur "API" dans le menu
3. Vous verrez deux clés importantes :
   - **Project URL** : Quelque chose comme `https://xxxxx.supabase.co`
   - **anon public** : Une longue clé qui commence par `eyJ...`

## Étape 5 : Configurer les variables d'environnement

1. Dans votre projet TAGE MAGE Trainer, copiez le fichier `.env.local.example` :
   ```bash
   cp .env.local.example .env.local
   ```

2. Ouvrez `.env.local` et remplacez les valeurs :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...votre-clé-ici
   ```

3. Sauvegardez le fichier

## Étape 6 : Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Étape 7 : Créer un compte

1. L'application vous montrera un écran de connexion
2. Cliquez sur "Pas encore de compte ? S'inscrire"
3. Remplissez vos informations
4. **IMPORTANT** : Vous recevrez un email de confirmation
5. Cliquez sur le lien dans l'email pour confirmer votre compte
6. Retournez sur l'application et connectez-vous

🎉 **C'est tout ! Votre application est maintenant connectée à Supabase !**

## Vérification

Pour vérifier que tout fonctionne :

1. Créez une question de test
2. Allez dans Supabase > Table Editor
3. Vous devriez voir votre question dans la table `questions`

## Désactiver la confirmation par email (Optionnel - Pour le développement)

Si vous voulez éviter la confirmation par email pendant le développement :

1. Dans Supabase, allez dans **Authentication** > **Providers** > **Email**
2. Désactivez "Confirm email"
3. Sauvegardez

⚠️ **Ne faites ça qu'en développement !**

## Migration depuis localStorage

Si vous aviez déjà des questions dans localStorage :

1. Exportez vos questions (bouton Export dans l'interface)
2. Une fois connecté avec Supabase, utilisez le bouton Import
3. Vos questions seront importées dans Supabase

## Troubleshooting

### Erreur "Invalid API key"
- Vérifiez que vous avez bien copié la clé **anon public** (pas la clé service_role)
- Vérifiez qu'il n'y a pas d'espaces avant ou après dans le `.env.local`

### Erreur "Failed to fetch"
- Vérifiez que l'URL est correcte dans `.env.local`
- Vérifiez que le projet Supabase est bien démarré

### Erreur lors de l'exécution du SQL
- Assurez-vous de copier **tout** le fichier `schema.sql`
- Essayez de le copier par sections si vous avez une erreur

### Je ne reçois pas l'email de confirmation
- Vérifiez vos spams
- Ou désactivez la confirmation email (voir ci-dessus)

## Support

Pour plus d'aide :
- [Documentation Supabase](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
