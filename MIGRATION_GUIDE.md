# Guide de Migration des Questions vers Supabase

Ce guide vous explique comment migrer vos questions depuis un fichier JSON vers votre base de données Supabase.

## Structure actuelle de la base de données

Votre base de données Supabase contient les tables suivantes :

### Table `questions`
Chaque question est stockée avec :
- **Informations de base** : catégorie, question, options, réponse correcte, explication
- **Métadonnées** : difficulté (easy/medium/hard), tags, notes, image URL
- **Fonctionnalités** : favoris (is_favorite)
- **Statistiques** : nombre de fois répondu, correct, incorrect, temps moyen, dernière réponse

### Tables complémentaires
- **training_sessions** : Sessions d'entraînement avec mode, score, temps
- **question_results** : Résultats détaillés pour chaque question d'une session
- **user_streaks** : Suivi des séries de jours consécutifs

## Prérequis

1. **Installer les dépendances**
```bash
npm install
```

2. **Obtenir votre User ID**

Pour migrer vos questions, vous devez d'abord obtenir votre User ID :

### Méthode 1 : Via la console du navigateur
1. Lancez votre application : `npm run dev`
2. Connectez-vous avec votre compte
3. Ouvrez la console du navigateur (F12)
4. Dans l'onglet Console, tapez :
```javascript
const { data } = await (await fetch('/api/user')).json();
console.log(data.user.id);
```

### Méthode 2 : Via Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans "Authentication" > "Users"
4. Copiez l'UUID de votre utilisateur

## Migration

### Étape 1 : Préparer votre fichier JSON

Votre fichier JSON doit avoir le format suivant :

```json
{
  "questions": [
    {
      "category": "Logique",
      "question": "Quel est le PGCD de 96 et 40 ?",
      "options": ["4", "8", "16", "20"],
      "correctAnswer": 1,
      "explanation": "On décompose : 96 = 2⁵ × 3 et 40 = 2³ × 5. Le PGCD est 2³ = 8",
      "difficulty": "medium",
      "tags": ["arithmétique", "pgcd"],
      "isFavorite": false
    }
  ],
  "exportedAt": "2025-01-13T10:00:00.000Z"
}
```

### Étape 2 : Lancer la migration

```bash
npm run migrate-questions questions-tage-mage-exemples.json "VOTRE-USER-ID"
```

Remplacez :
- `questions-tage-mage-exemples.json` par le chemin vers votre fichier JSON
- `"VOTRE-USER-ID"` par l'UUID obtenu à l'étape précédente

### Exemple complet

```bash
npm run migrate-questions questions-tage-mage-exemples.json "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Résultat attendu

Le script affichera :
```
🚀 Début de la migration des questions...

📊 30 question(s) trouvée(s) dans le fichier

✅ Question 1/30 importée: Quel est le PGCD de 96 et 40 ?...
✅ Question 2/30 importée: Si 3x + 7 = 22, quelle est la valeur de x ?...
...

📊 Résultat de la migration:
   ✅ 30 question(s) importée(s)
   ❌ 0 erreur(s)
   📝 Total: 30 question(s)

✨ Migration terminée avec succès!
```

## Vérification

Pour vérifier que vos questions ont bien été importées :

1. Connectez-vous sur votre application
2. Les questions devraient apparaître dans la liste
3. Vous pouvez également vérifier dans Supabase Dashboard :
   - Table Editor > questions

## Importation via l'interface

Vous pouvez aussi importer des questions directement depuis l'interface de l'application :

1. Lancez l'application : `npm run dev`
2. Connectez-vous
3. Cliquez sur "Import/Export"
4. Sélectionnez votre fichier JSON
5. Cliquez sur "Importer"

## Dépannage

### Erreur : "User not authenticated"
- Vérifiez que votre User ID est correct
- Assurez-vous que l'utilisateur existe dans Supabase Authentication

### Erreur : "Variables d'environnement Supabase manquantes"
- Vérifiez que votre fichier `.env` contient :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Erreur : "Format invalide"
- Vérifiez que votre JSON contient un tableau `questions`
- Assurez-vous que le JSON est valide

### Questions en double
- Le script ne vérifie pas les doublons
- Si vous relancez le script, les questions seront ajoutées en double
- Pour éviter cela, supprimez d'abord les questions existantes via l'interface ou Supabase Dashboard

## Avantages de Supabase

Maintenant que vos questions sont dans Supabase, vous bénéficiez de :

✅ **Synchronisation** : Vos questions sont synchronisées entre tous vos appareils
✅ **Backup automatique** : Supabase sauvegarde automatiquement vos données
✅ **Sécurité** : RLS (Row Level Security) garantit que seul vous pouvez voir vos questions
✅ **Performance** : Indexes optimisés pour des requêtes rapides
✅ **Statistiques** : Tracking automatique des performances
✅ **Images** : Stockage des images dans Supabase Storage
✅ **Collaboration future** : Possibilité de partager des questions avec d'autres utilisateurs

## Structure vs Notion

Voici la comparaison entre la structure Notion proposée et Supabase :

| Notion | Supabase | Type |
|--------|----------|------|
| Titre (Title) | question (TEXT) | La question |
| Catégorie (Select) | category (TEXT) | Catégorie |
| Options (Rich Text) | options (JSONB) | Les 4 options |
| Réponse correcte (Number) | correct_answer (INTEGER) | Index de la réponse |
| Explication (Rich Text) | explanation (TEXT) | Explication |
| Difficulté (Select) | difficulty (TEXT) | easy/medium/hard |
| Tags (Multi-select) | tags (TEXT[]) | Tags |
| Image URL (URL) | image_url (TEXT) | URL image |
| Is Favorite (Checkbox) | is_favorite (BOOLEAN) | Favori |
| Times Answered (Number) | times_answered (INTEGER) | Stats |
| Times Correct (Number) | times_correct (INTEGER) | Stats |
| Times Incorrect (Number) | times_incorrect (INTEGER) | Stats |

**Avantage Supabase** : En plus de toutes les fonctionnalités Notion, vous avez :
- Relations avec les sessions d'entraînement
- Tracking du temps de réponse
- Calcul automatique des statistiques
- Système de séries (streaks)
