/**
 * Script de migration pour importer les questions depuis un fichier JSON vers Supabase
 * Usage: npm run migrate-questions
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface QuestionJSON {
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  isFavorite?: boolean;
}

async function migrateQuestions(jsonFilePath: string, userId: string) {
  console.log('🚀 Début de la migration des questions...\n');

  // Lire le fichier JSON
  const fullPath = path.resolve(jsonFilePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier non trouvé: ${fullPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  const data = JSON.parse(fileContent);

  if (!data.questions || !Array.isArray(data.questions)) {
    console.error('❌ Format invalide: le fichier doit contenir un tableau "questions"');
    process.exit(1);
  }

  console.log(`📊 ${data.questions.length} question(s) trouvée(s) dans le fichier\n`);

  let imported = 0;
  let errors = 0;

  for (let i = 0; i < data.questions.length; i++) {
    const q: QuestionJSON = data.questions[i];

    try {
      const { data: insertedData, error } = await supabase
        .from('questions')
        .insert({
          user_id: userId,
          category: q.category,
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation || null,
          difficulty: q.difficulty || 'medium',
          tags: q.tags || [],
          is_favorite: q.isFavorite || false,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur pour la question ${i + 1}: ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Question ${i + 1}/${data.questions.length} importée: ${q.question.substring(0, 50)}...`);
        imported++;
      }
    } catch (error) {
      console.error(`❌ Exception pour la question ${i + 1}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Résultat de la migration:');
  console.log(`   ✅ ${imported} question(s) importée(s)`);
  console.log(`   ❌ ${errors} erreur(s)`);
  console.log(`   📝 Total: ${data.questions.length} question(s)\n`);
}

// Vérifier les arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npm run migrate-questions <chemin-fichier-json> <user-id>');
  console.log('\nExemple:');
  console.log('  npm run migrate-questions questions-tage-mage-exemples.json "uuid-de-votre-utilisateur"');
  console.log('\nPour obtenir votre user ID:');
  console.log('  1. Connectez-vous sur votre application');
  console.log('  2. Ouvrez la console du navigateur');
  console.log('  3. Tapez: (await supabase.auth.getUser()).data.user.id');
  process.exit(1);
}

const [jsonFilePath, userId] = args;

// Lancer la migration
migrateQuestions(jsonFilePath, userId)
  .then(() => {
    console.log('✨ Migration terminée avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  });
