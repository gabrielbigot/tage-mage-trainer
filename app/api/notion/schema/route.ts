import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { notionCache } from "@/lib/notion/cache";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

// GET - Retrieve database schema (all categories and tags defined in Notion)
export async function GET() {
  try {
    // Check cache first
    const cached = notionCache.getSchema();
    if (cached) {
      console.log("[Cache] Returning cached schema");
      return NextResponse.json(cached);
    }

    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID,
    });

    const properties = database.properties as any;

    // Log all property names and types for debugging
    const propInfo = Object.entries(properties).map(([name, prop]: [string, any]) => `${name} (${prop.type})`);
    console.log("[Schema] Database properties:", propInfo.join(", "));

    // Extract all categories from the "Catégorie" select property
    const categoryProp = properties["Catégorie"] || properties["Category"];
    const categories: string[] = categoryProp?.select?.options?.map((opt: any) => opt.name) || [];

    // Extract all tags from the "Tags" multi-select property
    const tagsProp = properties["Tags"];
    const tags: string[] = tagsProp?.multi_select?.options?.map((opt: any) => opt.name) || [];

    // Find the date property name (for client-side reference)
    const datePropertyName = Object.keys(properties).find(name => {
      const prop = properties[name];
      return (prop.type === "date" || prop.type === "created_time" || prop.type === "last_edited_time") &&
        (name.toLowerCase().includes("date") || name.toLowerCase().includes("création") || name.toLowerCase().includes("ajout"));
    });
    console.log("[Schema] Date property found:", datePropertyName || "none");

    const result = { categories, tags, datePropertyName: datePropertyName || null };
    notionCache.setSchema(result);
    console.log(`[Cache] Cached schema (${categories.length} categories, ${tags.length} tags)`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching database schema:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch database schema" },
      { status: 500 }
    );
  }
}
