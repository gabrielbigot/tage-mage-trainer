import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// PATCH - Mettre à jour une question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { question, category, options, correctAnswer, explanation, difficulty, tags, isFavorite, questionType, doubleSeriesData } = body;

    const properties: any = {};

    if (question !== undefined) {
      properties.Question = {
        title: [{ text: { content: question } }],
      };
    }

    if (category !== undefined) {
      properties.Catégorie = {
        select: { name: category },
      };
    }

    if (tags !== undefined) {
      properties.Tags = {
        multi_select: tags.map((tag: string) => ({ name: tag })),
      };
    }

    if (difficulty !== undefined) {
      properties.Difficulté = {
        select: { name: difficulty },
      };
    }

    if (isFavorite !== undefined) {
      properties.Favoris = {
        checkbox: isFavorite,
      };
    }

    if (questionType !== undefined) {
      properties.Type = {
        select: { name: questionType },
      };
    }

    if (questionType === "double-series" && doubleSeriesData !== undefined) {
      properties["Série Double"] = {
        rich_text: [{ text: { content: JSON.stringify(doubleSeriesData) } }],
      };
    } else if (questionType === "standard") {
      // Clear double series data if switching back to standard
      properties["Série Double"] = {
        rich_text: [],
      };
    }

    if (Object.keys(properties).length > 0) {
      await notion.pages.update({
        page_id: id,
        properties,
      });
    }

    // Si les options ou l'explication changent, recréer le contenu
    if (options !== undefined || explanation !== undefined || correctAnswer !== undefined) {
      // Récupérer les blocs existants
      const response = await notion.blocks.children.list({
        block_id: id,
      });

      // Supprimer tous les blocs existants
      for (const block of response.results) {
        await notion.blocks.delete({
          block_id: (block as any).id,
        });
      }

      // Recréer le contenu
      const children: any[] = [];

      if (options) {
        options.forEach((option: string, index: number) => {
          children.push({
            type: "to_do",
            to_do: {
              rich_text: [{ text: { content: option } }],
              checked: index === (correctAnswer ?? 0),
            },
          });
        });
      }

      children.push({
        type: "paragraph",
        paragraph: { rich_text: [] },
      });

      if (explanation) {
        children.push({
          type: "heading_3",
          heading_3: {
            rich_text: [{ text: { content: "Explication" } }],
          },
        });

        children.push({
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: explanation } }],
          },
        });
      }

      await notion.blocks.children.append({
        block_id: id,
        children,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer (archiver) une question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await notion.pages.update({
      page_id: id,
      archived: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete question" },
      { status: 500 }
    );
  }
}
