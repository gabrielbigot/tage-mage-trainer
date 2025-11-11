# 🎯 Guide de Test Rapide - TAGE MAGE Trainer

## 📦 Fichiers créés pour vos tests

J'ai créé **30 questions complètes de TAGE MAGE** pour vous permettre de tester immédiatement toutes les fonctionnalités de l'application !

### Fichiers disponibles :

1. **`supabase/seed-questions.sql`** - Script SQL pour import direct en base
2. **`questions-tage-mage-exemples.json`** - Fichier JSON pour import via l'interface
3. **`IMPORTER_QUESTIONS.md`** - Guide détaillé d'importation

---

## 🚀 Import Rapide (Méthode recommandée)

### Option A : Via SQL (2 minutes)

```bash
# 1. Récupérer votre User ID
# Dans Supabase SQL Editor, exécutez :
SELECT id, email FROM auth.users;

# 2. Modifiez seed-questions.sql ligne 7 avec votre UUID

# 3. Exécutez le script complet dans SQL Editor
# → 30 questions importées instantanément !
```

### Option B : Via JSON (3 clics)

1. Allez dans **"Gérer mes questions"**
2. Section **"Import/Export"** → Cliquez sur **"Importer"**
3. Sélectionnez `questions-tage-mage-exemples.json`
4. ✅ C'est fait !

---

## 📊 Ce que vous pouvez tester

### ✅ Fonctionnalités principales

| Fonctionnalité | À tester | Questions utilisées |
|---|---|---|
| **Entraînement classique** | Session aléatoire | Toutes (30) |
| **Mode Examen** | Chronomètre 90s/question | N'importe lesquelles |
| **Modification** | Éditer une question | Cliquez sur crayon |
| **Filtres catégories** | Logique, Calcul, etc. | 15 Logique, 13 Calcul |
| **Filtres difficulté** | Facile, Moyen, Difficile | 13 faciles, 14 moyennes, 3 difficiles |
| **Tags** | Filtrer par tag | 40+ tags différents |
| **Favoris** | Questions favorites | 3 déjà favorites |
| **Statistiques** | Progression | Après plusieurs sessions |
| **Mode Révision** | Questions ratées | Répondez mal volontairement |

---

## 🎓 Questions incluses (30 total)

### Par catégorie :
- **Logique** (15) : Suites, analogies, syllogismes, géométrie, combinatoire
- **Calcul** (13) : Pourcentages, fractions, vitesse, probabilités, moyennes
- **Conditions Minimales** (2) : Divisibilité, conditions logiques
- **Expression** (2) : Vocabulaire, synonymes

### Par difficulté :
- **Facile** (13) : Idéal pour commencer et tester l'interface
- **Moyen** (14) : Niveau standard TAGE MAGE
- **Difficile** (3) : Challenge (escargot, dénombrement, débits)

### Avec fonctionnalités :
- ✅ Toutes ont des **explications détaillées**
- ✅ Toutes ont des **tags** (arithmétique, algèbre, probabilité...)
- ✅ 3 sont **favorites** par défaut
- ✅ Variété de **types** (calcul mental, raisonnement, verbal)

---

## 🧪 Scénarios de test suggérés

### Test 1 : Première utilisation (5 min)
1. Importez les questions
2. Lancez **"Entraînement"** → Faites 5 questions
3. Regardez les **résultats** et **statistiques**

### Test 2 : Mode Examen (10 min)
1. Cliquez sur **"Examen"**
2. Configurez : 10 questions, 90s chacune
3. Testez le **timer** et le **passage automatique**
4. Voyez vos **performances sous pression**

### Test 3 : Gestion de questions (5 min)
1. Allez dans **"Gérer mes questions"**
2. **Modifiez** une question (cliquez sur crayon)
3. **Ajoutez** une nouvelle question avec une image
4. **Filtrez** par catégorie "Logique"

### Test 4 : Mode Révision (10 min)
1. Faites un entraînement
2. Répondez **mal volontairement** à 3-4 questions
3. Allez dans **"Révision"**
4. Voyez vos **questions ratées** avec % d'erreur
5. Lancez une session de révision

### Test 5 : Statistiques (5 min)
1. Complétez 2-3 sessions
2. Allez dans **"Statistiques"**
3. Regardez :
   - Score moyen
   - Performance par catégorie
   - Série de jours consécutifs
   - Historique des sessions

---

## 📸 Exemples de questions

**Facile - Algèbre :**
> Si 3x + 7 = 22, quelle est la valeur de x ?
> - Réponse : **5**
> - Explication : 3x = 15, donc x = 5

**Moyen - Probabilité :**
> En lançant deux dés, quelle est la probabilité d'obtenir 7 ?
> - Réponse : **1/6**
> - Explication : 6 cas favorables sur 36 possibles

**Difficile - Logique :**
> Un escargot monte un mur de 10m. Le jour +3m, la nuit -2m. En combien de jours ?
> - Réponse : **8 jours**
> - Explication : Jours 1-7 = +1m/jour. Jour 8 : atteint 10m avant la nuit

---

## 🐛 Vérifications importantes

Après import, vérifiez que :

- [ ] Les **30 questions** apparaissent dans "Mes questions"
- [ ] Les **catégories** sont bien affichées (Logique, Calcul, etc.)
- [ ] Les **niveaux de difficulté** sont visibles (badges colorés)
- [ ] Les **tags** apparaissent (petites étiquettes bleues)
- [ ] Les **3 favoris** ont une étoile ⭐
- [ ] Les **explications** s'affichent après validation

---

## 🎯 Objectifs de test

Avec ces 30 questions, vous devriez pouvoir :

1. ✅ Tester **toutes les fonctionnalités** de l'app
2. ✅ Avoir une **vraie expérience** d'entraînement
3. ✅ Voir des **statistiques** significatives
4. ✅ Comprendre le **flux utilisateur** complet
5. ✅ Identifier d'**éventuels bugs** ou améliorations

---

## 💡 Astuce

Une fois les questions importées, vous pouvez :
- Les **modifier** pour les personnaliser
- En **supprimer** certaines
- En **ajouter** de nouvelles manuellement
- **Exporter** tout pour backup

---

## ❓ Besoin d'aide ?

- Consultez `IMPORTER_QUESTIONS.md` pour le guide détaillé
- Les questions ne s'affichent pas ? → Rafraîchissez (F5)
- Erreur SQL ? → Vérifiez que vous avez remplacé `VOTRE_USER_ID`

Bon test ! 🚀
