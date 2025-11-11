/**
 * Types pour l'intégration Notion
 */

import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

/**
 * Structure d'une page Question dans Notion
 *
 * Propriétés de la base de données :
 * - Titre : Question (title)
 * - Catégorie : Select (Logique, Calcul, Expression, Conditions Minimales)
 * - Tags : Multi-select (arithmétique, pgcd, algèbre, etc.)
 * - Difficulté : Select (easy, medium, hard)
 * - Favoris : Checkbox
 *
 * Contenu de la page :
 * - Liste de tâches avec les options (la cochée est la bonne réponse)
 * - Paragraphe avec l'explication/correction
 */

export interface NotionQuestion {
  id: string;
  title: string;
  category: string;
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
  isFavorite: boolean;
  options: string[];
  correctAnswer: number; // Index de la bonne réponse (0-3)
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Propriétés de la base de données Notion
 */
export interface NotionDatabaseProperties {
  Question: {
    type: "title";
    title: Array<{ plain_text: string }>;
  };
  Catégorie: {
    type: "select";
    select: { name: string } | null;
  };
  Tags: {
    type: "multi_select";
    multi_select: Array<{ name: string }>;
  };
  Difficulté: {
    type: "select";
    select: { name: string } | null;
  };
  Favoris: {
    type: "checkbox";
    checkbox: boolean;
  };
}

/**
 * Types de blocs dans le contenu de la page
 */
export type NotionBlock = {
  type: string;
  id: string;
  [key: string]: any;
};

export type NotionToDoBlock = {
  type: "to_do";
  id: string;
  to_do: {
    rich_text: Array<{ plain_text: string }>;
    checked: boolean;
  };
};

export type NotionParagraphBlock = {
  type: "paragraph";
  id: string;
  paragraph: {
    rich_text: Array<{ plain_text: string }>;
  };
};

export type NotionHeadingBlock = {
  type: "heading_2" | "heading_3";
  id: string;
  heading_2?: {
    rich_text: Array<{ plain_text: string }>;
  };
  heading_3?: {
    rich_text: Array<{ plain_text: string }>;
  };
};
