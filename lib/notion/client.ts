import { Client } from "@notionhq/client";

// Initialiser le client Notion
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// ID de la base de données (à configurer dans .env)
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
