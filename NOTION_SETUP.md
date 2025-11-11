# Configuration Notion pour TAGE MAGE Trainer

Ce guide vous explique comment configurer Notion comme backend pour votre application TAGE MAGE Trainer.

## 🎯 Vue d'ensemble

Votre application utilisera Notion comme base de données pour stocker les questions. Chaque question sera une page dans une base de données Notion avec :

- **Propriétés** : Titre (Question), Catégorie, Tags, Difficulté, Favoris
- **Contenu de la page** :
  - Liste de tâches (to_do) avec les options de réponse
  - La case cochée indique la bonne réponse
  - Paragraphe(s) avec l'explication/correction

## 📋 Étape 1 : Créer une intégration Notion

1. Allez sur https://www.notion.so/my-integrations
2. Cliquez sur **"+ New integration"**
3. Donnez-lui un nom : `TAGE MAGE Trainer`
4. Sélectionnez votre workspace
5. Sous **Capabilities**, assurez-vous que les options suivantes sont activées :
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
6. Cliquez sur **Submit**
7. **Copiez le "Internal Integration Token"** (commence par `secret_...`)

## 📊 Étape 2 : Créer la base de données

1. Ouvrez Notion
2. Créez une nouvelle page
3. Ajoutez une **Database - Full page**
4. Nommez-la : `Questions TAGE MAGE`

### Configuration des propriétés

Votre base de données doit avoir les propriétés suivantes :

| Nom de la propriété | Type | Valeurs possibles |
|---------------------|------|-------------------|
| **Question** | Title | Le texte de la question |
| **Catégorie** | Select | Logique, Calcul, Expression, Conditions Minimales |
| **Tags** | Multi-select | arithmétique, pgcd, algèbre, équation, suite, fibonacci, etc. |
| **Difficulté** | Select | easy, medium, hard |
| **Favoris** | Checkbox | ☑️ ou ☐ |

### Comment créer ces propriétés :

1. Cliquez sur **"+ New property"** ou sur une colonne existante
2. Pour chaque propriété :
   - **Question** : Renommez la première colonne "Name" en "Question" (elle est déjà de type Title)
   - **Catégorie** : Type = Select, ajoutez les options : Logique, Calcul, Expression, Conditions Minimales
   - **Tags** : Type = Multi-select, ajoutez vos tags (arithmétique, pgcd, algèbre, etc.)
   - **Difficulté** : Type = Select, ajoutez : easy, medium, hard
   - **Favoris** : Type = Checkbox

## 🔗 Étape 3 : Partager la base de données avec votre intégration

1. Dans votre base de données Notion, cliquez sur **"..."** en haut à droite
2. Cliquez sur **"Connect to"** ou **"Add connections"**
3. Cherchez et sélectionnez **"TAGE MAGE Trainer"** (le nom de votre intégration)
4. Confirmez

## 🆔 Étape 4 : Obtenir l'ID de la base de données

L'ID de la base de données se trouve dans l'URL de votre page Notion :

```
https://www.notion.so/votre-workspace/0123456789abcdef0123456789abcdef?v=...
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    C'est votre NOTION_DATABASE_ID
```

L'ID est la longue chaîne de caractères (32 caractères) après le nom de votre workspace et avant le `?v=`.

## ⚙️ Étape 5 : Configurer les variables d'environnement

1. Ouvrez le fichier `.env` à la racine de votre projet
2. Ajoutez vos clés Notion :

```env
NOTION_API_KEY=secret_votre_integration_token_ici
NOTION_DATABASE_ID=votre_database_id_ici
```

Exemple :
```env
NOTION_API_KEY=secret_1234567890abcdefghijklmnopqrstuvwxyz
NOTION_DATABASE_ID=0123456789abcdef0123456789abcdef
```

## 📤 Étape 6 : Importer vos questions existantes

Une fois la configuration terminée, importez vos questions :

```bash
npm run migrate-to-notion questions-tage-mage-exemples.json
```

Le script va :
- Lire votre fichier JSON
- Créer une page Notion pour chaque question
- Ajouter les propriétés (catégorie, tags, difficulté, etc.)
- Créer les to_do avec les options (la bonne cochée)
- Ajouter l'explication en bas de page

## 🎨 Structure d'une page question dans Notion

Voici à quoi ressemble une question dans Notion :

```
Titre : Quel est le PGCD de 96 et 40 ?

Propriétés :
- Catégorie : Logique
- Tags : arithmétique, pgcd
- Difficulté : medium
- Favoris : ☐

Contenu de la page :
☐ 4
☐ 8
☑ 16
☐ 20

### Explication
On décompose : 96 = 2⁵ × 3 et 40 = 2³ × 5. Le PGCD est 2³ = 8
```

## ✨ Utilisation de l'application

Une fois configuré, votre application fonctionnera exactement comme avant, mais avec Notion comme backend :

1. Lancez l'application : `npm run dev`
2. Les questions seront chargées depuis Notion
3. Vous pouvez ajouter/modifier/supprimer des questions via l'interface
4. Les modifications seront synchronisées avec Notion
5. Vous pouvez aussi modifier directement dans Notion !

## 🔄 Avantages de Notion

✅ **Interface visuelle** : Modifiez vos questions directement dans Notion
✅ **Synchronisation** : Accessible partout où Notion est disponible
✅ **Organisation** : Utilisez les vues, filtres, et tris de Notion
✅ **Collaboration** : Partagez votre base de données avec d'autres
✅ **Backup** : Notion sauvegarde automatiquement tout
✅ **Recherche puissante** : Trouvez rapidement vos questions
✅ **Markdown** : Formatez vos explications avec du texte riche

## 📱 Workflow recommandé

### Créer une question manuellement dans Notion :

1. Ouvrez votre base de données
2. Cliquez sur **"+ New"**
3. Remplissez les propriétés :
   - Titre : La question
   - Catégorie : Choisissez dans la liste
   - Tags : Ajoutez les tags pertinents
   - Difficulté : easy, medium ou hard
   - Favoris : Cochez si c'est un favori
4. Dans le contenu de la page :
   - Tapez `/todo` pour créer une liste de tâches
   - Ajoutez vos 4 options
   - **Cochez la bonne réponse**
5. Ajoutez un paragraphe vide
6. Tapez `/heading3` puis "Explication"
7. Ajoutez votre explication en dessous

### Créer une question via l'application :

1. Utilisez le formulaire d'ajout de question
2. La question sera automatiquement créée dans Notion avec la bonne structure

## 🔍 Filtres et vues Notion

Profitez des vues Notion pour organiser vos questions :

### Vue "Par Catégorie"
- Grouper par : Catégorie
- Trier par : Date de création (décroissant)

### Vue "Favoris"
- Filtre : Favoris = Coché

### Vue "Par Difficulté"
- Grouper par : Difficulté
- Trier par : Date de création

### Vue "À réviser"
- Créez des tags personnalisés : "à-réviser", "difficile", etc.
- Filtrez par ces tags

## 🚨 Dépannage

### Erreur : "Object not found"
➡️ Vérifiez que vous avez bien partagé la base de données avec votre intégration

### Erreur : "Invalid request_url"
➡️ Vérifiez que votre NOTION_DATABASE_ID est correct (32 caractères)

### Erreur : "Unauthorized"
➡️ Vérifiez que votre NOTION_API_KEY est correct et commence par `secret_`

### Les questions ne s'affichent pas
➡️ Vérifiez que les propriétés de la base de données ont les bons noms :
   - "Question" (Title)
   - "Catégorie" (Select)
   - "Tags" (Multi-select)
   - "Difficulté" (Select)
   - "Favoris" (Checkbox)

### Les options ne s'affichent pas correctement
➡️ Assurez-vous que les options sont des to_do (liste de tâches)
➡️ Une seule case doit être cochée (la bonne réponse)

## 📊 Statistiques

**Note importante** : Notion n'est pas optimal pour stocker les statistiques de session. L'application utilise donc le localStorage du navigateur pour :
- Les sessions d'entraînement en cours
- Les statistiques (nombre de fois répondu, taux de réussite, etc.)
- Les streaks (séries de jours consécutifs)

Les statistiques sont stockées localement et synchronisées avec les questions Notion lors de l'affichage.

## 🔄 Revenir à Supabase

Si vous voulez revenir à Supabase, éditez `lib/storage.ts` :

```typescript
// Utiliser Supabase
export { supabaseStorage as storage } from "./supabase-storage";

// Au lieu de Notion
// export { notionStorage as storage } from "./notion-storage";
```

## 🎉 C'est terminé !

Votre application est maintenant connectée à Notion ! Profitez de la flexibilité de Notion combinée à la puissance de votre application d'entraînement.

**Questions ?** Consultez la documentation Notion API : https://developers.notion.com/
