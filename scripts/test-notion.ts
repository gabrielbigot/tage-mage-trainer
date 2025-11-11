/**
 * Script de test pour vérifier la connexion Notion
 */

import { Client } from '@notionhq/client';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const notionApiKey = process.env.NOTION_API_KEY!;
const notionDatabaseId = process.env.NOTION_DATABASE_ID!;

console.log('🔍 Test de connexion Notion...\n');

console.log('Configuration:');
console.log(`  API Key: ${notionApiKey?.substring(0, 20)}...`);
console.log(`  Database ID: ${notionDatabaseId}\n`);

if (!notionApiKey || !notionDatabaseId) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const notion = new Client({ auth: notionApiKey });

async function testNotion() {
  try {
    console.log('📡 Test 1: Récupération des informations de la base de données...');
    const database = await notion.databases.retrieve({
      database_id: notionDatabaseId,
    });
    console.log(`✅ Base de données trouvée: ${(database as any).title?.[0]?.plain_text || 'Sans titre'}\n`);

    console.log('📡 Test 2: Récupération des pages...');
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
      page_size: 5,
    });
    console.log(`✅ ${response.results.length} page(s) trouvée(s)\n`);

    if (response.results.length > 0) {
      console.log('📄 Première page:');
      const firstPage = response.results[0] as any;
      console.log(`  ID: ${firstPage.id}`);
      console.log(`  Créée le: ${firstPage.created_time}`);

      // Afficher les propriétés
      console.log('  Propriétés:');
      Object.keys(firstPage.properties).forEach(key => {
        console.log(`    - ${key}: ${firstPage.properties[key].type}`);
      });
    }

    console.log('\n✨ Tous les tests ont réussi!');
    console.log('\n✅ Votre intégration Notion fonctionne correctement.');
    console.log('✅ La base de données est bien partagée avec votre intégration.');
  } catch (error: any) {
    console.error('\n❌ Erreur lors des tests:', error.message);

    if (error.code === 'object_not_found') {
      console.error('\n💡 Solution:');
      console.error('   1. Ouvrez votre base de données Notion');
      console.error('   2. Cliquez sur "..." (trois points) en haut à droite');
      console.error('   3. Cliquez sur "Connections" ou "Add connections"');
      console.error('   4. Sélectionnez votre intégration');
      console.error('   5. Relancez ce script\n');
    } else if (error.code === 'unauthorized') {
      console.error('\n💡 Solution:');
      console.error('   1. Vérifiez que votre NOTION_API_KEY est correct');
      console.error('   2. La clé doit commencer par "secret_" ou "ntn_"');
      console.error('   3. Vérifiez le fichier .env\n');
    } else {
      console.error('\n💡 Détails de l\'erreur:');
      console.error(error);
    }

    process.exit(1);
  }
}

testNotion();
