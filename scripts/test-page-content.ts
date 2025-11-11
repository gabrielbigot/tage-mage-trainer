/**
 * Script pour tester le contenu d'une page Notion
 */

import { Client } from '@notionhq/client';
import { config } from 'dotenv';

config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function getPageBlocks(blockId: string, level = 0): Promise<any[]> {
  const blocks: any[] = [];
  const indent = '  '.repeat(level);

  try {
    const response = await notion.blocks.children.list({
      block_id: blockId,
    });

    for (const block of response.results) {
      const blockData = block as any;

      console.log(`${indent}[${blockData.type}] ${blockData.id}`);

      if (blockData[blockData.type]?.rich_text) {
        const text = blockData[blockData.type].rich_text
          .map((t: any) => t.plain_text)
          .join('');
        console.log(`${indent}  Text: ${text}`);
      }

      if (blockData.type === 'to_do') {
        console.log(`${indent}  Checked: ${blockData.to_do.checked}`);
      }

      if (blockData.has_children) {
        console.log(`${indent}  ↳ Has children, fetching...`);
        const children = await getPageBlocks(blockData.id, level + 1);
        blockData.children = children;
      }

      blocks.push(blockData);
    }
  } catch (error) {
    console.error('Error fetching blocks:', error);
  }

  return blocks;
}

async function testPageContent() {
  try {
    // Récupérer la première page de la base
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      page_size: 1,
    });

    if (response.results.length === 0) {
      console.log('Aucune page trouvée');
      return;
    }

    const page = response.results[0] as any;
    console.log('\n📄 Page ID:', page.id);
    console.log('📝 Titre:', page.properties.Question?.title?.[0]?.plain_text || 'Sans titre');
    console.log('\n📦 Structure des blocs:\n');

    const blocks = await getPageBlocks(page.id);

    console.log('\n\n📋 JSON complet (premiers blocs):');
    console.log(JSON.stringify(blocks.slice(0, 3), null, 2));
  } catch (error: any) {
    console.error('Erreur:', error.message);
    console.error(error);
  }
}

testPageContent();
