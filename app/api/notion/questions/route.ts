import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { notionCache } from "@/lib/notion/cache";

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
  // Conditions minimales
  let conditionsMinimalesData = null;
  let condition1 = "";
  let condition2 = "";
  // Image support
  let imageUrl = "";

  for (const block of blocks) {
    // Check for image blocks
    if (block.type === "image") {
      // Notion images can be either uploaded (file) or external (external)
      const imageBlock = block.image;
      if (imageBlock.type === "file") {
        imageUrl = imageBlock.file.url;
      } else if (imageBlock.type === "external") {
        imageUrl = imageBlock.external.url;
      }
      console.log(`[Question ${title}] Found image:`, imageUrl);
    }
    // Check for double series markers in bullet lists (NEW SIMPLE FORMAT)
    else if (block.type === "bulleted_list_item") {
      const text = block.bulleted_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";

      // Debug log for all bullet items
      console.log(`[Question ${title}] Found bullet item:`, JSON.stringify(text));

      // Horizontal series: starts with → or ➡️
      if (text.startsWith("→") || text.startsWith("➡️") || text.startsWith("➡")) {
        questionType = "double-series";
        const content = text.replace(/^[→➡️➡]\s*/, "").trim();

        if (content.includes("Label:")) {
          horizontalLabel = content.replace("Label:", "").trim();
        } else if (content.includes("|")) {
          horizontalSeries = content.split("|").map((s: string) => {
            const cleaned = s.trim();
            return cleaned === "?" || cleaned === "" ? "?" : cleaned;
          });
          console.log(`[Question ${title}] Parsed horizontal series (bullet):`, horizontalSeries);
        }
      }

      // Vertical series: starts with ↓ or ⬇️
      else if (text.startsWith("↓") || text.startsWith("⬇️") || text.startsWith("⬇")) {
        questionType = "double-series";
        const content = text.replace(/^[↓⬇️⬇]\s*/, "").trim();

        if (content.includes("Label:")) {
          verticalLabel = content.replace("Label:", "").trim();
        } else if (content.includes("|")) {
          verticalSeries = content.split("|").map((s: string) => {
            const cleaned = s.trim();
            return cleaned === "?" || cleaned === "" ? "?" : cleaned;
          });
          console.log(`[Question ${title}] Parsed vertical series (bullet):`, verticalSeries);
        }
      }
      // Conditions minimales: starts with (1) or (2) - check with includes for robustness
      else if (text.includes("(1)") && text.indexOf("(1)") < 5) {
        questionType = "conditions-minimales";
        condition1 = text.replace(/.*\(1\)\s*/, "").trim();
        console.log(`[Question ${title}] Parsed condition 1:`, condition1);
      }
      else if (text.includes("(2)") && text.indexOf("(2)") < 5) {
        questionType = "conditions-minimales";
        condition2 = text.replace(/.*\(2\)\s*/, "").trim();
        console.log(`[Question ${title}] Parsed condition 2:`, condition2);
      }
    }
    // BACKWARD COMPATIBILITY: Keep callout parsing for existing questions
    else if (block.type === "callout") {
      const text = block.callout?.rich_text?.map((t: any) => t.plain_text).join("") || "";
      const icon = block.callout?.icon?.emoji || "";

      if (text.includes("SÉRIE HORIZONTALE") || text.includes("SERIE HORIZONTALE") || icon === "➡️") {
        questionType = "double-series";
        console.log(`[Question ${title}] Found horizontal series callout:`, text);

        // Parse label and series from text - ignore empty lines
        const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        console.log(`[Question ${title}] Horizontal lines after split:`, lines);

        // Check if everything is on one line (format: SÉRIE HORIZONTALE Label: xxx A | B | C)
        const firstLine = lines[0] || "";
        if (firstLine.includes("|") && (firstLine.includes("SÉRIE HORIZONTALE") || firstLine.includes("SERIE HORIZONTALE"))) {
          // Extract label if present
          const labelMatch = firstLine.match(/Label:\s*([^A-Z0-9|]+)/);
          if (labelMatch) {
            horizontalLabel = labelMatch[1].trim();
          }

          // Extract series: everything after the last alphabetic word before the first "|"
          const seriesMatch = firstLine.match(/([A-Z0-9\s|?]+\|[A-Z0-9\s|?]+)$/i);
          if (seriesMatch) {
            horizontalSeries = seriesMatch[1].split("|").map((s: string) => {
              const cleaned = s.trim();
              return cleaned === "?" || cleaned === "" ? "?" : cleaned;
            });
            console.log(`[Question ${title}] Parsed horizontal series (single line):`, horizontalSeries);
          }
        } else {
          // Multi-line format (original logic)
          for (const line of lines) {
            if (line.includes("Label:")) {
              horizontalLabel = line.replace("Label:", "").trim();
            } else if (line.includes("|") && !line.includes("SÉRIE") && !line.includes("SERIE")) {
              // Clean up each element and normalize "?"
              horizontalSeries = line.split("|").map((s: string) => {
                const cleaned = s.trim();
                return cleaned === "?" || cleaned === "" ? "?" : cleaned;
              });
              console.log(`[Question ${title}] Parsed horizontal series (multi-line):`, horizontalSeries);
            }
          }
        }
      } else if (text.includes("SÉRIE VERTICALE") || text.includes("SERIE VERTICALE") || icon === "⬇️") {
        questionType = "double-series";
        console.log(`[Question ${title}] Found vertical series callout:`, text);

        // Parse label and series from text - ignore empty lines
        const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        console.log(`[Question ${title}] Vertical lines after split:`, lines);

        // Check if everything is on one line (format: SÉRIE VERTICALE Label: xxx A | B | C)
        const firstLine = lines[0] || "";
        if (firstLine.includes("|") && (firstLine.includes("SÉRIE VERTICALE") || firstLine.includes("SERIE VERTICALE"))) {
          // Extract label if present
          const labelMatch = firstLine.match(/Label:\s*([^A-Z0-9|]+)/);
          if (labelMatch) {
            verticalLabel = labelMatch[1].trim();
          }

          // Extract series: everything after the last alphabetic word before the first "|"
          const seriesMatch = firstLine.match(/([A-Z0-9\s|?]+\|[A-Z0-9\s|?]+)$/i);
          if (seriesMatch) {
            verticalSeries = seriesMatch[1].split("|").map((s: string) => {
              const cleaned = s.trim();
              return cleaned === "?" || cleaned === "" ? "?" : cleaned;
            });
            console.log(`[Question ${title}] Parsed vertical series (single line):`, verticalSeries);
          }
        } else {
          // Multi-line format (original logic)
          for (const line of lines) {
            if (line.includes("Label:")) {
              verticalLabel = line.replace("Label:", "").trim();
            } else if (line.includes("|") && !line.includes("SÉRIE") && !line.includes("SERIE")) {
              // Clean up each element and normalize "?"
              verticalSeries = line.split("|").map((s: string) => {
                const cleaned = s.trim();
                return cleaned === "?" || cleaned === "" ? "?" : cleaned;
              });
              console.log(`[Question ${title}] Parsed vertical series (multi-line):`, verticalSeries);
            }
          }
        }
      }
    } else if (block.type === "to_do") {
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

      // Skip heading blocks that are just section titles
      const headingKeywords = ["explication", "réponse", "solution", "calcul", "méthode"];
      const isHeadingTitle = (block.type === "heading_2" || block.type === "heading_3") &&
                             headingKeywords.some(keyword => text.trim().toLowerCase() === keyword);

      if (text.trim() && !isHeadingTitle) {
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
  console.log(`[Question ${title}] Final check - questionType: ${questionType}, hSeries length: ${horizontalSeries.length}, vSeries length: ${verticalSeries.length}`);
  if (questionType === "double-series" && horizontalSeries.length > 0 && verticalSeries.length > 0) {
    doubleSeriesData = {
      horizontalSeries,
      verticalSeries,
      horizontalLabel: horizontalLabel || undefined,
      verticalLabel: verticalLabel || undefined,
    };
    console.log(`[Question ${title}] Created doubleSeriesData:`, doubleSeriesData);
  } else if (questionType === "double-series") {
    console.error(`[Question ${title}] ERROR: Double series detected but data incomplete! hSeries:`, horizontalSeries, "vSeries:", verticalSeries);
  }

  // Build conditions minimales data if found
  if (questionType === "conditions-minimales" && condition1 && condition2) {
    conditionsMinimalesData = {
      condition1,
      condition2,
    };
    console.log(`[Question ${title}] Created conditionsMinimalesData:`, conditionsMinimalesData);
  } else if (questionType === "conditions-minimales") {
    console.error(`[Question ${title}] ERROR: Conditions minimales detected but data incomplete! c1:`, condition1, "c2:", condition2);
  }

  // Detect graphic series: questions with an image that aren't already another special type
  if (imageUrl && questionType === "standard") {
    questionType = "graphic-series";
    console.log(`[Question ${title}] Detected as graphic-series (has image)`);
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
    imageUrl: imageUrl || undefined,
    questionType,
    doubleSeriesData,
    conditionsMinimalesData,
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
    const noCache = searchParams.get("nocache") === "true";

    const hasFilters = category || difficulty || favorite || tags;

    // Use cache for unfiltered requests (the most common case)
    if (!hasFilters && !noCache) {
      const cached = notionCache.getQuestions();
      if (cached) {
        console.log(`[Cache] Returning ${cached.length} cached questions`);
        return NextResponse.json({ questions: cached });
      }
    }

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

    // Pagination: récupérer TOUTES les questions (Notion limite à 100 par requête)
    let allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter,
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
        start_cursor: startCursor,
        page_size: 100, // Maximum autorisé par Notion
      });

      allResults = [...allResults, ...response.results];
      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    const questions = await Promise.all(
      allResults.map(page => notionPageToQuestion(page))
    );

    // Cache unfiltered results
    if (!hasFilters) {
      notionCache.setQuestions(questions);
      console.log(`[Cache] Cached ${questions.length} questions`);
    }

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
    const { question, category, options, correctAnswer, explanation, difficulty, tags, isFavorite, questionType, doubleSeriesData, conditionsMinimalesData } = body;

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

    // Si c'est une série double, créer des listes à puces (format simple)
    if (questionType === "double-series" && doubleSeriesData) {
      const { horizontalSeries, verticalSeries, horizontalLabel, verticalLabel } = doubleSeriesData;

      // Série horizontale avec bullet
      children.push({
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `→ ${horizontalSeries.join(" | ")}` } }],
        },
      });

      // Label horizontal (optionnel)
      if (horizontalLabel) {
        children.push({
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ text: { content: `→ Label: ${horizontalLabel}` } }],
          },
        });
      }

      // Série verticale avec bullet
      children.push({
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `↓ ${verticalSeries.join(" | ")}` } }],
        },
      });

      // Label vertical (optionnel)
      if (verticalLabel) {
        children.push({
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ text: { content: `↓ Label: ${verticalLabel}` } }],
          },
        });
      }

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
    }
    // Si c'est des conditions minimales, créer des listes à puces avec (1) et (2)
    else if (questionType === "conditions-minimales" && conditionsMinimalesData) {
      const { condition1, condition2 } = conditionsMinimalesData;

      // Condition 1
      children.push({
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `(1) ${condition1}` } }],
        },
      });

      // Condition 2
      children.push({
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: `(2) ${condition2}` } }],
        },
      });

      children.push({
        type: "paragraph",
        paragraph: { rich_text: [] },
      });

      // Options de réponse
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

    // Invalidate cache after creating a question
    notionCache.invalidateQuestions();

    return NextResponse.json({ question: newQuestion });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
}
