# TAGE MAGE Trainer

Application complète d'entraînement au TAGE MAGE avec interface moderne et épurée.

## 🚀 Fonctionnalités principales

### 📝 Gestion des questions
- **Création de questions** avec options multiples
- **Catégorisation** par thème (Logique, Calcul, Compréhension, etc.)
- **Niveaux de difficulté** : Facile, Moyen, Difficile
- **Tags personnalisables** pour une organisation avancée
- **Favoris** : Marquez vos questions importantes
- **Explications détaillées** pour chaque réponse
- Modification et suppression des questions

### 🎯 Modes d'entraînement

#### Mode Pratique
- Sessions avec questions aléatoires
- Suivi du temps par question
- Feedback immédiat sur les réponses
- Explications détaillées après chaque réponse
- Barre de progression visuelle

#### Mode Révision
- Revoir uniquement les questions ratées
- Tri par taux d'erreur
- Focus sur vos points faibles
- Statistiques détaillées par question

### 📊 Statistiques et suivi

- **Tableau de bord complet** :
  - Nombre total de sessions
  - Score moyen et meilleur score
  - Temps total d'entraînement
  - Série de jours consécutifs (streak)

- **Performance par catégorie** :
  - Taux de réussite par thème
  - Graphiques de progression
  - Identification des points faibles

- **Performance par difficulté** :
  - Statistiques pour chaque niveau
  - Suivi de votre évolution

- **Historique des sessions** :
  - 10 dernières sessions
  - Scores et temps détaillés
  - Date et heure de chaque session

### 💾 Import / Export
- **Exportation** de toutes vos données en JSON
- **Importation** de questions depuis un fichier
- Détection automatique des doublons
- Sauvegarde régulière recommandée
- Partage de questions entre utilisateurs

### 🌓 Interface moderne

- **Mode sombre / clair** avec toggle persistant
- Design épuré et responsive
- Navigation intuitive
- Animations fluides
- Compatible mobile, tablette et desktop

## 🛠️ Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique pour un code robuste
- **Tailwind CSS** : Framework CSS utilitaire
- **shadcn/ui** : Composants UI modernes et accessibles
- **Lucide React** : Icônes élégantes
- **LocalStorage** : Persistance des données côté client

## 📦 Installation

```bash
npm install
```

## 🚀 Lancement rapide

### Sur Windows
Double-cliquez sur `start.bat` pour lancer automatiquement l'application.

### Manuellement
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🏗️ Build de production

```bash
npm run build
npm start
```

## 📁 Structure du projet

```
tage-mage-trainer/
├── app/
│   ├── layout.tsx          # Layout principal avec ThemeProvider
│   ├── page.tsx            # Page d'accueil et navigation
│   └── globals.css         # Styles globaux et thème
├── components/
│   ├── ui/                 # Composants shadcn/ui
│   ├── question-form.tsx   # Formulaire d'ajout de questions
│   ├── question-list.tsx   # Liste et gestion des questions
│   ├── training-session.tsx # Session d'entraînement
│   ├── review-mode.tsx     # Mode révision
│   ├── statistics-view.tsx # Vue des statistiques
│   ├── import-export.tsx   # Import/Export de données
│   ├── theme-provider.tsx  # Provider pour le thème
│   └── theme-toggle.tsx    # Bouton de toggle du thème
├── lib/
│   ├── types.ts            # Définitions TypeScript
│   ├── storage.ts          # Système de stockage local
│   └── utils.ts            # Fonctions utilitaires
└── start.bat               # Script de lancement Windows
```

## 📖 Guide d'utilisation

### 1. Ajouter des questions

1. Cliquez sur **"Questions"** dans l'accueil
2. Remplissez le formulaire :
   - Catégorie et niveau de difficulté
   - Texte de la question
   - Options de réponse (minimum 2)
   - Sélectionnez la bonne réponse
   - Ajoutez une explication (optionnel)
   - Ajoutez des tags (optionnel)
   - Marquez comme favori si nécessaire
3. Cliquez sur **"Ajouter la question"**

### 2. S'entraîner

1. Cliquez sur **"Entraînement"** dans l'accueil
2. Répondez aux questions une par une
3. Validez votre réponse pour voir la correction
4. Passez à la question suivante
5. Consultez vos résultats en fin de session

### 3. Réviser vos erreurs

1. Cliquez sur **"Révision"** dans l'accueil
2. Consultez la liste des questions ratées
3. Choisissez le nombre de questions à réviser
4. Lancez la session de révision

### 4. Suivre vos progrès

1. Cliquez sur **"Statistiques"** dans l'accueil
2. Consultez :
   - Vos scores moyens
   - Votre progression par catégorie
   - Votre série de jours consécutifs
   - L'historique de vos sessions

### 5. Sauvegarder / Partager

1. Dans la section **"Questions"**, utilisez le module **Import/Export**
2. **Exporter** : Téléchargez toutes vos données
3. **Importer** : Chargez un fichier JSON de questions

## ✨ Fonctionnalités avancées

### Système de Streak (Série)
- Entraînez-vous chaque jour pour maintenir votre série
- Battez votre record personnel
- Motivation gamifiée

### Tracking temporel
- Temps par question enregistré
- Temps total par session
- Identification des questions chronophages

### Filtrage intelligent
- Par catégorie
- Par difficulté
- Par tags
- Questions favorites
- Questions ratées

## 🎨 Personnalisation

### Thème
Utilisez le bouton en haut à droite (lune/soleil) pour basculer entre le mode clair et sombre.

### Organisation
- Créez vos propres catégories
- Utilisez des tags pour une organisation fine
- Marquez vos questions importantes en favoris

## 🔒 Données

Toutes vos données sont stockées localement dans votre navigateur (LocalStorage). Aucune donnée n'est envoyée sur internet.

**Important** : Pensez à exporter régulièrement vos données pour créer des sauvegardes !

## 🐛 Résolution de problèmes

### Les données ont disparu
- Vérifiez que vous n'avez pas vidé le cache du navigateur
- Restaurez depuis une sauvegarde exportée

### L'application ne se lance pas
- Vérifiez que Node.js est installé
- Supprimez `node_modules` et `.next` puis relancez `npm install`

## 🤝 Contribution

Ce projet est open source. N'hésitez pas à l'améliorer !

## 📄 Licence

MIT

---

Bon entraînement pour le TAGE MAGE ! 🎓
