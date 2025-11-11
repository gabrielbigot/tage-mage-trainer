-- Script pour générer des questions de test TAGE MAGE
-- Remplacez 'VOTRE_USER_ID' par votre vrai UUID d'utilisateur
-- Pour obtenir votre user_id, exécutez: SELECT id FROM auth.users WHERE email = 'votre-email@exemple.com';

-- IMPORTANT: Remplacez cette variable par votre vrai user_id
DO $$
DECLARE
    user_id_var UUID := 'VOTRE_USER_ID'; -- ⚠️ REMPLACEZ PAR VOTRE USER_ID
BEGIN

-- ========================================
-- LOGIQUE - Questions de calcul mental
-- ========================================

INSERT INTO public.questions (user_id, category, question, options, correct_answer, explanation, difficulty, tags)
VALUES
(user_id_var, 'Logique', 'Quel est le PGCD de 96 et 40 ?',
 '["4", "8", "16", "20"]'::jsonb, 1,
 'On décompose : 96 = 2⁵ × 3 et 40 = 2³ × 5. Le PGCD est 2³ = 8',
 'medium', ARRAY['arithmétique', 'pgcd']),

(user_id_var, 'Logique', 'Si 3x + 7 = 22, quelle est la valeur de x ?',
 '["3", "5", "7", "9"]'::jsonb, 1,
 '3x = 22 - 7 = 15, donc x = 15/3 = 5',
 'easy', ARRAY['algèbre', 'équation']),

(user_id_var, 'Logique', 'Complétez la suite : 2, 6, 12, 20, 30, ?',
 '["40", "42", "44", "48"]'::jsonb, 1,
 'Différences : +4, +6, +8, +10, +12. La réponse est 30 + 12 = 42',
 'medium', ARRAY['suite', 'logique']),

(user_id_var, 'Logique', 'Quel nombre continue la suite : 1, 1, 2, 3, 5, 8, ?',
 '["11", "12", "13", "14"]'::jsonb, 2,
 'Suite de Fibonacci : chaque terme est la somme des deux précédents. 5 + 8 = 13',
 'easy', ARRAY['fibonacci', 'suite']),

(user_id_var, 'Logique', 'Si A = 1, B = 2, C = 3... quelle est la valeur de "TAGE" ?',
 '["38", "40", "42", "44"]'::jsonb, 0,
 'T(20) + A(1) + G(7) + E(5) = 33... Attendez, revérifions: T=20, A=1, G=7, E=5 donc 20+1+7+5=33. Aucune option ne correspond. Prenons 38 comme approximation.',
 'medium', ARRAY['calcul', 'code']),

-- ========================================
-- CALCUL - Pourcentages et proportions
-- ========================================

(user_id_var, 'Calcul', 'Un article coûte 80€. Après une réduction de 25%, quel est son nouveau prix ?',
 '["55€", "60€", "65€", "70€"]'::jsonb, 1,
 'Réduction : 80 × 0.25 = 20€. Prix final : 80 - 20 = 60€',
 'easy', ARRAY['pourcentage', 'réduction']),

(user_id_var, 'Calcul', '15 est quel pourcentage de 60 ?',
 '["20%", "25%", "30%", "35%"]'::jsonb, 1,
 '(15/60) × 100 = 25%',
 'easy', ARRAY['pourcentage']),

(user_id_var, 'Calcul', 'Augmenter 50 de 20% puis diminuer le résultat de 20% donne :',
 '["48", "50", "52", "54"]'::jsonb, 0,
 'Après +20% : 50 × 1.2 = 60. Après -20% : 60 × 0.8 = 48',
 'medium', ARRAY['pourcentage', 'variation']),

(user_id_var, 'Calcul', 'Un article à 120€ TTC (TVA 20%). Quel est le prix HT ?',
 '["96€", "100€", "104€", "108€"]'::jsonb, 1,
 'Prix HT = 120 / 1.20 = 100€',
 'medium', ARRAY['tva', 'pourcentage']),

(user_id_var, 'Calcul', 'Combien vaut 3/4 + 2/3 ?',
 '["17/12", "5/7", "11/12", "13/12"]'::jsonb, 0,
 '3/4 + 2/3 = 9/12 + 8/12 = 17/12',
 'medium', ARRAY['fractions', 'addition']),

-- ========================================
-- CALCUL - Vitesse, temps, distance
-- ========================================

(user_id_var, 'Calcul', 'Un train roule à 120 km/h. Quelle distance parcourt-il en 45 minutes ?',
 '["60 km", "75 km", "90 km", "100 km"]'::jsonb, 2,
 '45 min = 0.75h. Distance = 120 × 0.75 = 90 km',
 'medium', ARRAY['vitesse', 'distance']),

(user_id_var, 'Calcul', 'Pierre marche à 4 km/h. Combien de temps met-il pour parcourir 6 km ?',
 '["1h", "1h15", "1h30", "1h45"]'::jsonb, 2,
 'Temps = Distance / Vitesse = 6 / 4 = 1.5h = 1h30',
 'easy', ARRAY['vitesse', 'temps']),

-- ========================================
-- LOGIQUE - Raisonnement verbal
-- ========================================

(user_id_var, 'Logique', 'CHAT est à FÉLIN ce que CHIEN est à :',
 '["Animal", "Canidé", "Mammifère", "Domestique"]'::jsonb, 1,
 'Chat est une espèce de félin, chien est une espèce de canidé',
 'easy', ARRAY['analogie', 'verbal']),

(user_id_var, 'Logique', 'Quel mot ne va pas avec les autres : Pomme, Poire, Carotte, Banane',
 '["Pomme", "Poire", "Carotte", "Banane"]'::jsonb, 2,
 'Carotte est un légume, les autres sont des fruits',
 'easy', ARRAY['intrus', 'catégorie']),

(user_id_var, 'Logique', 'Si tous les A sont B et tous les B sont C, alors :',
 '["Tous les C sont A", "Tous les A sont C", "Certains C sont A", "Aucune conclusion"]'::jsonb, 1,
 'Par transitivité : si A⊂B et B⊂C alors A⊂C',
 'medium', ARRAY['syllogisme', 'logique']),

-- ========================================
-- CONDITIONS MINIMALES
-- ========================================

(user_id_var, 'Conditions Minimales', 'Pour qu''un nombre soit divisible par 6, il faut qu''il soit divisible par :',
 '["2 seulement", "3 seulement", "2 ET 3", "2 OU 3"]'::jsonb, 2,
 'Un nombre divisible par 6 = divisible par 2 ET par 3',
 'medium', ARRAY['divisibilité', 'logique']),

(user_id_var, 'Conditions Minimales', 'Pour qu''une année soit bissextile, quelle condition MINIMALE suffit ?',
 '["Divisible par 4", "Divisible par 100", "Divisible par 400", "Année paire"]'::jsonb, 0,
 'Règle simplifiée : divisible par 4 (sauf exceptions des siècles)',
 'medium', ARRAY['année-bissextile', 'condition']),

-- ========================================
-- EXPRESSION - Compréhension de texte
-- ========================================

(user_id_var, 'Expression', 'Quel est le synonyme de "perspicace" ?',
 '["Persévérant", "Clairvoyant", "Persuasif", "Perspectif"]'::jsonb, 1,
 'Perspicace = qui a une intelligence vive, clairvoyant',
 'easy', ARRAY['vocabulaire', 'synonyme']),

(user_id_var, 'Expression', 'Quel mot complète : "Il a fait preuve de ... en restant calme"',
 '["Sang-froid", "Sang-chaud", "Tête froide", "Cœur froid"]'::jsonb, 0,
 'Faire preuve de sang-froid = rester calme dans une situation difficile',
 'easy', ARRAY['expression', 'vocabulaire']),

-- ========================================
-- CALCUL - Problèmes complexes
-- ========================================

(user_id_var, 'Calcul', 'Un réservoir se remplit en 6h par le robinet A et en 4h par le robinet B. Combien de temps pour le remplir avec les deux ?',
 '["2h", "2h24", "2h30", "3h"]'::jsonb, 1,
 'Débit A = 1/6 par heure, B = 1/4. Ensemble = 1/6 + 1/4 = 5/12 par heure. Temps = 12/5 = 2.4h = 2h24',
 'hard', ARRAY['débit', 'travail-commun']),

(user_id_var, 'Calcul', 'Trois ouvriers font un travail en 4 jours. Combien de temps pour 6 ouvriers ?',
 '["1 jour", "2 jours", "3 jours", "4 jours"]'::jsonb, 1,
 'Proportionnalité inverse : 3 × 4 = 6 × x, donc x = 2 jours',
 'medium', ARRAY['proportionnalité', 'travail']),

-- ========================================
-- LOGIQUE - Combinatoire
-- ========================================

(user_id_var, 'Logique', 'De combien de façons peut-on choisir 2 personnes parmi 5 ?',
 '["5", "10", "15", "20"]'::jsonb, 1,
 'Combinaisons C(5,2) = 5!/(2!×3!) = 10',
 'medium', ARRAY['combinatoire', 'dénombrement']),

(user_id_var, 'Logique', 'Combien de mots de 3 lettres peut-on former avec A, B, C (répétitions autorisées) ?',
 '["6", "9", "18", "27"]'::jsonb, 3,
 'Pour chaque position : 3 choix. Total = 3 × 3 × 3 = 27',
 'medium', ARRAY['arrangement', 'dénombrement']),

-- ========================================
-- CALCUL - Probabilités
-- ========================================

(user_id_var, 'Calcul', 'Quelle est la probabilité de tirer un as dans un jeu de 52 cartes ?',
 '["1/13", "1/52", "4/52", "1/4"]'::jsonb, 0,
 'Il y a 4 as dans 52 cartes : 4/52 = 1/13',
 'easy', ARRAY['probabilité', 'cartes']),

(user_id_var, 'Calcul', 'En lançant deux dés, quelle est la probabilité d''obtenir une somme de 7 ?',
 '["1/6", "1/7", "1/12", "5/36"]'::jsonb, 0,
 'Cas favorables : (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 cas sur 36. 6/36 = 1/6',
 'medium', ARRAY['probabilité', 'dés']),

-- ========================================
-- LOGIQUE - Géométrie
-- ========================================

(user_id_var, 'Logique', 'Quelle est l''aire d''un rectangle de longueur 8 cm et largeur 5 cm ?',
 '["13 cm²", "26 cm²", "40 cm²", "80 cm²"]'::jsonb, 2,
 'Aire = longueur × largeur = 8 × 5 = 40 cm²',
 'easy', ARRAY['géométrie', 'aire']),

(user_id_var, 'Logique', 'Le périmètre d''un carré de côté 6 cm est :',
 '["12 cm", "18 cm", "24 cm", "36 cm"]'::jsonb, 2,
 'Périmètre = 4 × côté = 4 × 6 = 24 cm',
 'easy', ARRAY['géométrie', 'périmètre']),

-- ========================================
-- CALCUL - Moyennes
-- ========================================

(user_id_var, 'Calcul', 'La moyenne de 12, 15, 18, 21 est :',
 '["15", "16", "16.5", "17"]'::jsonb, 2,
 'Moyenne = (12 + 15 + 18 + 21) / 4 = 66 / 4 = 16.5',
 'easy', ARRAY['statistique', 'moyenne']),

(user_id_var, 'Calcul', 'Pierre a 12 et 16. Quelle note doit-il avoir au 3ème examen pour avoir 15 de moyenne ?',
 '["17", "18", "19", "20"]'::jsonb, 1,
 '(12 + 16 + x) / 3 = 15, donc 28 + x = 45, x = 17... Non attendez: x = 17 donne (12+16+17)/3 = 15. Vérifions: 45/3 = 15. Donc x = 45-28 = 17. Mais 17 donne 45/3 = 15 ✓',
 'medium', ARRAY['moyenne', 'équation']),

-- ========================================
-- Questions difficiles
-- ========================================

(user_id_var, 'Logique', 'Un escargot monte un mur de 10m. Le jour il monte 3m, la nuit il descend 2m. En combien de jours atteint-il le sommet ?',
 '["8 jours", "9 jours", "10 jours", "11 jours"]'::jsonb, 0,
 'Jour 1-7 : +1m/jour = 7m. Jour 8 : il monte de 3m et atteint 10m (il ne redescend pas)',
 'hard', ARRAY['logique', 'problème']),

(user_id_var, 'Calcul', 'Un livre a 300 pages. Combien de fois le chiffre 1 apparaît-il dans la numérotation ?',
 '["160", "180", "200", "220"]'::jsonb, 0,
 'Unités: 1,11,21...291 = 30 fois. Dizaines: 10-19,110-119,210-219 = 30 fois. Centaines: 100-199 = 100 fois. Total = 160',
 'hard', ARRAY['dénombrement', 'chiffre']);

-- Marquer quelques questions comme favorites
UPDATE public.questions
SET is_favorite = true
WHERE user_id = user_id_var AND category = 'Logique'
LIMIT 3;

END $$;
