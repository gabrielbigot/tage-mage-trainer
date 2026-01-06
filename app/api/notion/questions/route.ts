import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

// Helper pour convertir une page Notion en Question
async function notionPageToQuestion(page: any) {
  const properties = page.properties;

  const titleProp = properties.Question || properties.Name || properties.title;
  const title = titleProp?.title?.[0]?.plain_text || "";

  const categoryProp = properties.Catégorie || properties.Category;
  const category = categoryProp?.select?.name || "Autre";

  const tagsProp = properties.Tags;
  const tags = tagsProp?.multi_select?.map((tag: any) => tag.name) || [];

  const difficultyProp = properties.Difficulté || properties.Difficulty;
  const difficulty = difficultyProp?.select?.name?.toLowerCase();

  const favorisProp = properties.Favoris || properties.Favorite;
  const isFavorite = favorisProp?.checkbox || false;

  // Récupérer le contenu de la page
  const blocksResponse = await notion.blocks.children.list({
    block_id: page.id,
  });

  const blocks = blocksResponse.results as any[];

  const options: string[] = [];
  let correctAnswer = 0;
  let explanation = "";
  let foundTodos = false;
  let afterTodos = false;
  let questionType = "standard";
  let doubleSeriesData = null;
  let horizontalSeries: string[] = [];
  let verticalSeries: string[] = [];
  let horizontalLabel = "";
  let verticalLabel = "";
  let isParsingDoubleSeries = false;
  let currentSeriesType = "";

  for (const block of blocks) {
    // Check for double series markers
    if (block.type === "callout") {
      const text = block.callout?.rich_text?.map((t: any) => t.plain_text).join("") || "";
      const icon = block.callout?.icon?.emoji || "";

      if (text.includes("SÉRIE HORIZONTALE") || icon === "➡️") {
        questionType = "double-series";
        isParsingDoubleSeries = true;
        currentSeriesType = "horizontal";

        // Parse label and series from text
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.includes("Label:")) {
            horizontalLabel = line.replace("Label:", "").trim();
          } else if (line.includes("|")) {
            horizontalSeries = line.split("|").map((s: string) => s.trim());
          }
        }
      } else if (text.includes("SÉRIE VERTICALE") || icon === "⬇️") {
        questionType = "double-series";
        isParsingDoubleSeries = true;
        currentSeriesType = "vertical";

        // Parse label and series from text
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.includes("Label:")) {
            verticalLabel = line.replace("Label:", "").trim();
          } else if (line.includes("|")) {
            verticalSeries = line.split("|").map((s: string) => s.trim());
          }
        }
      }
    } else if (block.type === "to_do" && !isParsingDoubleSeries) {
      foundTodos = true;
      const text = block.to_do.rich_text?.[0]?.plain_text || "";
      options.push(text);

      if (block.to_do.checked) {
        correctAnswer = options.length - 1;
      }
    } else if (foundTodos && (block.type === "paragraph" || block.type === "heading_2" || block.type === "heading_3")) {
      afterTodos = true;
      const content = block.type === "paragraph"
        ? block.paragraph?.rich_text
        : block.type === "heading_2"
        ? block.heading_2?.rich_text
        : block.heading_3?.rich_text;

      const text = content?.map((t: any) => t.plain_text).join("") || "";
      if (text.trim()) {
        explanation += (explanation ? "\n" : "") + text;
      }
    } else if (block.type === "bulleted_list_item" && afterTodos) {
      const text = block.bulleted_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";
      if (text.trim()) {
        explanation += "\n• " + text;
      }
    } else if (block.type === "numbered_list_item" && afterTodos) {
      const text = block.numbered_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";
      if (text.trim()) {
        explanation += "\n" + text;
      }
    }
  }

  // Build double series data if found
  if (questionType === "double-series" && horizontalSeries.length > 0 && verticalSeries.length > 0) {
    doubleSeriesData = {
      horizontalSeries,
      verticalSeries,
      horizontalLabel: horizontalLabel || undefined,
      verticalLabel: verticalLabel || undefined,
    };
  }

  return {
    id: page.id,
    category,
    question: title,
    options,
    correctAnswer,
    explanation: explanation.trim(),
    createdAt: new Date(page.created_time).getTime(),
    difficulty,
    tags: tags.length > 0 ? tags : undefined,
    isFavorite,
    questionType,
    doubleSeriesData,
  };
}

// GET - Récupérer toutes les questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const favorite = searchParams.get("favorite");
    const tags = searchParams.get("tags");

    let filter: any = undefined;

    if (category) {
      filter = {
        property: "Catégorie",
        select: {
          equals: category,
        },
      };
    } else if (difficulty) {
      filter = {
        property: "Difficulté",
        select: {
          equals: difficulty,
        },
      };
    } else if (favorite === "true") {
      filter = {
        property: "Favoris",
        checkbox: {
          equals: true,
        },
      };
    } else if (tags) {
      const tagArray = tags.split(",");
      filter = {
        or: tagArray.map(tag => ({
          property: "Tags",
          multi_select: {
            contains: tag,
          },
        })),
      };
    }

    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    });

    const questions = await Promise.all(
      response.results.map(page => notionPageToQuestion(page))
    );

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, category, options, correctAnswer, explanation, difficulty, tags, isFavorite, questionType, doubleSeriesData } = body;

    // Créer la page avec les propriétés
    const response = await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Question: {
          title: [{ text: { content: question } }],
        },
        Catégorie: {
          select: { name: category },
        },
        Tags: {
          multi_select: (tags || []).map((tag: string) => ({ name: tag })),
        },
        Difficulté: difficulty
          ? { select: { name: difficulty } }
          : { select: { name: "medium" } },
        Favoris: {
          checkbox: isFavorite || false,
        },
      } as any,
    });

    const pageId = response.id;

    // Ajouter le contenu
    const children: any[] = [];

    // Si c'est une série double, créer des blocs callout
    if (questionType === "double-series" && doubleSeriesData) {
      const { horizontalSeries, verticalSeries, horizontalLabel, verticalLabel } = doubleSeriesData;

      // Série horizontale
      const horizontalText = `SÉRIE HORIZONTALE\n${horizontalLabel ? `Label: ${horizontalLabel}\n` : ""}${horizontalSeries.join(" | ")}`;
      children.push({
        type: "callout",
        callout: {
          rich_text: [{ text: { content: horizontalText } }],
          icon: { emoji: "➡️" },
          color: "blue_background",
        },
      });

      // Série verticale
      const verticalText = `SÉRIE VERTICALE\n${verticalLabel ? `Label: ${verticalLabel}\n` : ""}${verticalSeries.join(" | ")}`;
      children.push({
        type: "callout",
        callout: {
          rich_text: [{ text: { content: verticalText } }],
          icon: { emoji: "⬇️" },
          color: "green_background",
        },
      });

      children.push({
        type: "paragraph",
        paragraph: { rich_text: [] },
      });

      // Options de réponse (paires de valeurs)
      options.forEach((option: string, index: number) => {
        children.push({
          type: "to_do",
          to_do: {
            rich_text: [{ text: { content: option } }],
            checked: index === correctAnswer,
          },
        });
      });
    } else {
      // Question standard
      options.forEach((option: string, index: number) => {
        children.push({
          type: "to_do",
          to_do: {
            rich_text: [{ text: { content: option } }],
            checked: index === correctAnswer,
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
      block_id: pageId,
      children,
    });

    const newQuestion = await notionPageToQuestion(response);

    return NextResponse.json({ question: newQuestion });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
}
