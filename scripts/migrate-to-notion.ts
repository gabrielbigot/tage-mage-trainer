/**
 * Script de migration pour importer les questions depuis un fichier JSON vers Notion
 * Usage: npm run migrate-to-notion
 */

import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Charger les variables d'environnement depuis .env
config();

// Configuration Notion
const notionApiKey = process.env.NOTION_API_KEY!;
const notionDatabaseId = process.env.NOTION_DATABASE_ID!;

if (!notionApiKey || !notionDatabaseId) {
  console.error('❌ Variables d\'environnement Notion manquantes');
  console.log('Assurez-vous que NOTION_API_KEY et NOTION_DATABASE_ID sont définis dans .env');
  process.exit(1);
}

const notion = new Client({ auth: notionApiKey });

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

async function migrateQuestionsToNotion(jsonFilePath: string) {
  console.log('🚀 Début de la migration des questions vers Notion...\n');

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
      // Créer la page Notion avec les propriétés
      const response = await notion.pages.create({
        parent: { database_id: notionDatabaseId },
        properties: {
          Question: {
            title: [
              {
                text: {
                  content: q.question,
                },
              },
            ],
          },
          Catégorie: {
            select: {
              name: q.category,
            },
          },
          Tags: {
            multi_select: (q.tags || []).map(tag => ({ name: tag })),
          },
          Difficulté: q.difficulty
            ? {
                select: {
                  name: q.difficulty,
                },
              }
            : {
                select: {
                  name: 'medium',
                },
              },
          Favoris: {
            checkbox: q.isFavorite || false,
          },
        } as any,
      });

      const pageId = response.id;

      // Ajouter le contenu de la page (options + explication)
      const children: any[] = [];

      // Ajouter les options en tant que to_do
      q.options.forEach((option, index) => {
        children.push({
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                text: {
                  content: option,
                },
              },
            ],
            checked: index === q.correctAnswer,
          },
        });
      });

      // Ajouter un saut de ligne
      children.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [],
        },
      });

      // Ajouter l'explication
      if (q.explanation) {
        children.push({
          type: 'heading_3',
          heading_3: {
            rich_text: [
              {
                text: {
                  content: 'Explication',
                },
              },
            ],
          },
        });

        children.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: q.explanation,
                },
              },
            ],
          },
        });
      }

      await notion.blocks.children.append({
        block_id: pageId,
        children,
      });

      console.log(`✅ Question ${i + 1}/${data.questions.length} importée: ${q.question.substring(0, 50)}...`);
      imported++;

      // Pause pour éviter les rate limits Notion
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error: any) {
      console.error(`❌ Erreur pour la question ${i + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n📊 Résultat de la migration:');
  console.log(`   ✅ ${imported} question(s) importée(s) dans Notion`);
  console.log(`   ❌ ${errors} erreur(s)`);
  console.log(`   📝 Total: ${data.questions.length} question(s)\n`);
}

// Vérifier les arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: npm run migrate-to-notion <chemin-fichier-json>');
  console.log('\nExemple:');
  console.log('  npm run migrate-to-notion questions-tage-mage-exemples.json');
  console.log('\nAssurez-vous d\'avoir configuré votre .env avec :');
  console.log('  - NOTION_API_KEY (obtenu depuis https://www.notion.so/my-integrations)');
  console.log('  - NOTION_DATABASE_ID (ID de votre base de données Notion)');
  process.exit(1);
}

const [jsonFilePath] = args;

// Lancer la migration
migrateQuestionsToNotion(jsonFilePath)
  .then(() => {
    console.log('✨ Migration vers Notion terminée avec succès!');
    console.log('\n💡 Allez voir votre base de données Notion pour vérifier les questions.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  });
