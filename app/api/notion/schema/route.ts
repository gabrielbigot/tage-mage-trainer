import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

// GET - Retrieve database schema (all categories and tags defined in Notion)
export async function GET() {
  try {
    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID,
    });

    const properties = database.properties as any;

    // Extract all categories from the "Catégorie" select property
    const categoryProp = properties["Catégorie"] || properties["Category"];
    const categories: string[] = categoryProp?.select?.options?.map((opt: any) => opt.name) || [];

    // Extract all tags from the "Tags" multi-select property
    const tagsProp = properties["Tags"];
    const tags: string[] = tagsProp?.multi_select?.options?.map((opt: any) => opt.name) || [];

    return NextResponse.json({ categories, tags });
  } catch (error: any) {
    console.error("Error fetching database schema:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch database schema" },
      { status: 500 }
    );
  }
}
