# Configuration du stockage d'images

Pour activer le support des images dans votre application TAGE MAGE Trainer, suivez ces étapes :

## 1. Créer le bucket de stockage dans Supabase

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Dans le menu latéral, cliquez sur **Storage**
4. Cliquez sur **Create a new bucket**
5. Configurez le bucket :
   - **Name**: `question-images`
   - **Public bucket**: ✅ Coché (pour permettre l'accès public aux images)
   - Cliquez sur **Create bucket**

## 2. Configurer les politiques de sécurité (RLS)

1. Dans le menu latéral, cliquez sur **SQL Editor**
2. Cliquez sur **New query**
3. Copiez et collez le contenu du fichier `supabase/storage-setup.sql`
4. Cliquez sur **Run** pour exécuter le script

Le script créera automatiquement les politiques suivantes :
- Les utilisateurs authentifiés peuvent uploader des images
- Les utilisateurs peuvent modifier/supprimer uniquement leurs propres images
- Tout le monde peut voir les images (accès public en lecture)

## 3. Vérifier la configuration

Pour vérifier que tout fonctionne :

1. Allez dans **Storage** → **question-images**
2. Vous devriez voir le bucket vide
3. Les politiques devraient être listées sous **Policies**

## 4. Utiliser les images dans l'application

Une fois configuré, vous pouvez :

1. **Ajouter une image à une question** :
   - Allez dans "Gérer mes questions"
   - Créez ou modifiez une question
   - Cliquez sur la zone "Cliquez pour ajouter ou glissez une image"
   - Sélectionnez une image (PNG, JPG, max 5MB)
   - L'aperçu s'affichera immédiatement
   - Enregistrez la question

2. **Voir les images** :
   - Les images s'affichent dans la liste des questions
   - Elles apparaissent pendant les sessions d'entraînement
   - Elles sont incluses dans les résultats des sessions

3. **Modifier/Supprimer une image** :
   - Modifiez la question
   - Cliquez sur "Supprimer" pour retirer l'image
   - Ou ajoutez une nouvelle image pour remplacer l'ancienne

## Structure de stockage

Les images sont organisées par utilisateur :
```
question-images/
├── [user-id-1]/
│   ├── image1.jpg
│   ├── image2.png
│   └── ...
├── [user-id-2]/
│   ├── image1.jpg
│   └── ...
```

Cela garantit que chaque utilisateur a ses propres images isolées.

## Limites

- Taille maximale par image : **5 MB**
- Formats supportés : **PNG, JPG, JPEG, GIF, WebP**
- Les images sont stockées de manière permanente jusqu'à suppression manuelle

## Dépannage

### Les images ne s'uploadent pas
1. Vérifiez que le bucket `question-images` existe
2. Vérifiez que le bucket est bien **public**
3. Vérifiez que les politiques RLS sont configurées
4. Consultez la console du navigateur (F12) pour voir les erreurs

### Les images ne s'affichent pas
1. Vérifiez que l'URL de l'image est correcte dans la base de données
2. Vérifiez que le bucket est **public**
3. Essayez d'ouvrir l'URL directement dans le navigateur

### Erreur "Policy not found"
1. Réexécutez le script `supabase/storage-setup.sql`
2. Vérifiez dans **Storage** → **Policies** que les politiques existent

## Support

Si vous rencontrez des problèmes, consultez :
- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Guide des politiques RLS](https://supabase.com/docs/guides/auth/row-level-security)
