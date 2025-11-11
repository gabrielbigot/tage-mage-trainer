# Guide d'importation des questions de test

Ce guide vous explique comment importer automatiquement 35+ questions de TAGE MAGE dans votre base de données pour tester l'application.

## Méthode 1 : Via Supabase SQL Editor (Recommandé)

### Étape 1 : Récupérer votre User ID

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête et exécutez :

```sql
SELECT id, email FROM auth.users;
```

5. **Copiez votre UUID** (exemple : `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Étape 2 : Modifier le script

1. Ouvrez le fichier `supabase/seed-questions.sql`
2. À la ligne 7, remplacez `'VOTRE_USER_ID'` par votre UUID :

**AVANT :**
```sql
user_id_var UUID := 'VOTRE_USER_ID';
```

**APRÈS :**
```sql
user_id_var UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### Étape 3 : Exécuter le script

1. Retournez dans **SQL Editor** sur Supabase
2. Cliquez sur **New query**
3. Copiez TOUT le contenu de `supabase/seed-questions.sql`
4. Collez-le dans l'éditeur
5. Cliquez sur **Run** (ou appuyez sur Ctrl/Cmd + Enter)
6. Vous devriez voir : `Success. No rows returned`

### Étape 4 : Vérifier

1. Allez dans **Table Editor** → **questions**
2. Vous devriez voir **35 questions** dans votre base
3. Rafraîchissez votre application → Les questions apparaissent ! 🎉

---

## Méthode 2 : Via l'interface d'import de l'application

Si vous préférez ne pas utiliser SQL :

1. Je peux créer un fichier JSON avec toutes les questions
2. Vous pourrez l'importer via l'interface "Import/Export" de l'application
3. Dites-moi si vous préférez cette méthode !

---

## Questions incluses (35 au total)

### Par catégorie :
- **Logique** : 15 questions (suites, analogies, syllogismes, géométrie, combinatoire)
- **Calcul** : 15 questions (pourcentages, fractions, vitesse, probabilités, moyennes)
- **Conditions Minimales** : 2 questions
- **Expression** : 2 questions

### Par difficulté :
- **Facile** : 15 questions (parfait pour débuter)
- **Moyen** : 17 questions (entraînement standard)
- **Difficile** : 3 questions (challenge)

### Fonctionnalités testées :
- ✅ Questions avec explications détaillées
- ✅ Tags pour organisation (arithmétique, algèbre, probabilité, etc.)
- ✅ Différents niveaux de difficulté
- ✅ 3 questions marquées comme favorites automatiquement
- ✅ Variété de types de questions (calcul, raisonnement, verbal)

---

## Exemples de questions incluses

**Facile :**
> Si 3x + 7 = 22, quelle est la valeur de x ?
> - Options : 3, **5**, 7, 9
> - Explication : 3x = 22 - 7 = 15, donc x = 15/3 = 5

**Moyen :**
> Un réservoir se remplit en 6h par le robinet A et en 4h par le robinet B. Combien de temps pour le remplir avec les deux ?
> - Options : 2h, **2h24**, 2h30, 3h
> - Explication : Débit combiné = 1/6 + 1/4 = 5/12 par heure. Temps = 12/5 = 2.4h = 2h24

**Difficile :**
> Un escargot monte un mur de 10m. Le jour il monte 3m, la nuit il descend 2m. En combien de jours atteint-il le sommet ?
> - Options : **8 jours**, 9 jours, 10 jours, 11 jours
> - Explication : Jours 1-7 : +1m/jour = 7m. Jour 8 : il monte de 3m et atteint 10m

---

## Dépannage

### Erreur "invalid input syntax for type uuid"
→ Vous n'avez pas remplacé `VOTRE_USER_ID` par votre vrai UUID

### Erreur "permission denied"
→ Vérifiez que vous êtes bien connecté à Supabase

### Les questions n'apparaissent pas dans l'app
→ Rafraîchissez la page (F5) ou reconnectez-vous

### Je veux supprimer toutes les questions
```sql
DELETE FROM public.questions WHERE user_id = 'VOTRE_USER_ID';
```

---

## Prochaines étapes

Une fois les questions importées, vous pouvez :

1. **Tester l'entraînement classique** → 10 questions aléatoires
2. **Tester le mode examen** → Avec chronomètre (90s par question)
3. **Tester le mode révision** → Répondez mal à quelques questions d'abord !
4. **Tester les filtres** → Par catégorie (Logique, Calcul, etc.)
5. **Tester la modification** → Cliquez sur l'icône crayon
6. **Tester les favoris** → 3 questions sont déjà favorites

Bon test ! 🚀
