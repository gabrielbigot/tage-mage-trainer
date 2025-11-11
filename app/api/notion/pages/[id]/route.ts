import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

/**
 * Récupère récursivement tous les blocs d'une page Notion (incluant les blocs enfants)
 */
async function getPageBlocks(blockId: string): Promise<any[]> {
  const blocks: any[] = [];

  try {
    const response = await notion.blocks.children.list({
      block_id: blockId,
    });

    for (const block of response.results) {
      const blockData = block as any;

      // Si le bloc a des enfants, les récupérer récursivement
      if (blockData.has_children) {
        const children = await getPageBlocks(blockData.id);
        blockData.children = children;
      }

      blocks.push(blockData);
    }
  } catch (error) {
    console.error("Error fetching blocks:", error);
  }

  return blocks;
}

// GET - Récupérer le contenu complet d'une page Notion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params;

    // Récupérer les informations de la page
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Récupérer tous les blocs de la page
    const blocks = await getPageBlocks(pageId);

    return NextResponse.json({
      page,
      blocks,
    });
  } catch (error: any) {
    console.error("Error fetching page content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch page content" },
      { status: 500 }
    );
  }
}
