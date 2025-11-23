"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronDown, AlertCircle, Info, Lightbulb, AlertTriangle } from "lucide-react";

/**
 * Composant pour afficher un texte enrichi Notion (avec gras, italique, code, etc.)
 */
function RichText({ text }: { text: any[] }) {
  if (!text || text.length === 0) return null;

  return (
    <>
      {text.map((item: any, index: number) => {
        let content = item.plain_text;
        let element = <span key={index}>{content}</span>;

        // Appliquer les styles
        if (item.annotations) {
          if (item.annotations.bold) {
            element = <strong key={index}>{content}</strong>;
          }
          if (item.annotations.italic) {
            element = <em key={index}>{element}</em>;
          }
          if (item.annotations.strikethrough) {
            element = <s key={index}>{element}</s>;
          }
          if (item.annotations.underline) {
            element = <u key={index}>{element}</u>;
          }
          if (item.annotations.code) {
            element = (
              <code
                key={index}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-red-600 dark:text-red-400"
              >
                {content}
              </code>
            );
          }
          if (item.annotations.color && item.annotations.color !== "default") {
            const colorClass = getColorClass(item.annotations.color);
            element = (
              <span key={index} className={colorClass}>
                {element}
              </span>
            );
          }
        }

        // Appliquer les liens
        if (item.href) {
          element = (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
            >
              {element}
            </a>
          );
        }

        return element;
      })}
    </>
  );
}

function getColorClass(color: string): string {
  const colors: Record<string, string> = {
    gray: "text-gray-600",
    brown: "text-amber-800",
    orange: "text-orange-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    pink: "text-pink-600",
    red: "text-red-600",
    gray_background: "bg-gray-100 px-1 rounded",
    brown_background: "bg-amber-100 px-1 rounded",
    orange_background: "bg-orange-100 px-1 rounded",
    yellow_background: "bg-yellow-100 px-1 rounded",
    green_background: "bg-green-100 px-1 rounded",
    blue_background: "bg-blue-100 px-1 rounded",
    purple_background: "bg-purple-100 px-1 rounded",
    pink_background: "bg-pink-100 px-1 rounded",
    red_background: "bg-red-100 px-1 rounded",
  };
  return colors[color] || "";
}

/**
 * Composant principal pour afficher un bloc Notion
 */
export function NotionBlock({ block, level = 0 }: { block: any; level?: number }) {
  const [isOpen, setIsOpen] = useState(true);

  const type = block.type;
  const content = block[type];

  // Paragraphe
  if (type === "paragraph") {
    return (
      <p className="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed">
        <RichText text={content.rich_text} />
      </p>
    );
  }

  // Titres
  if (type === "heading_1") {
    return (
      <>
        <h1 className="text-3xl font-bold mb-4 mt-8 text-gray-900 dark:text-white">
          <RichText text={content.rich_text} />
        </h1>
        {block.children && block.children.length > 0 && (
          <div className="ml-4">
            {block.children.map((child: any) => (
              <NotionBlock key={child.id} block={child} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  }

  if (type === "heading_2") {
    return (
      <>
        <h2 className="text-2xl font-bold mb-3 mt-6 text-gray-900 dark:text-white">
          <RichText text={content.rich_text} />
        </h2>
        {block.children && block.children.length > 0 && (
          <div className="ml-4">
            {block.children.map((child: any) => (
              <NotionBlock key={child.id} block={child} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  }

  if (type === "heading_3") {
    return (
      <>
        <h3 className="text-xl font-semibold mb-2 mt-4 text-gray-900 dark:text-white">
          <RichText text={content.rich_text} />
        </h3>
        {block.children && block.children.length > 0 && (
          <div className="ml-4">
            {block.children.map((child: any) => (
              <NotionBlock key={child.id} block={child} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  }

  // Liste à puces
  if (type === "bulleted_list_item") {
    return (
      <li className="mb-2 text-gray-800 dark:text-gray-200 ml-5 list-disc">
        <RichText text={content.rich_text} />
        {block.children && block.children.length > 0 && (
          <ul className="mt-2">
            {block.children.map((child: any) => (
              <NotionBlock key={child.id} block={child} level={level + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Liste numérotée
  if (type === "numbered_list_item") {
    return (
      <li className="mb-2 text-gray-800 dark:text-gray-200 ml-5 list-decimal">
        <RichText text={content.rich_text} />
        {block.children && block.children.length > 0 && (
          <ol className="mt-2">
            {block.children.map((child: any) => (
              <NotionBlock key={child.id} block={child} level={level + 1} />
            ))}
          </ol>
        )}
      </li>
    );
  }

  // To-do (utilisé pour les réponses)
  if (type === "to_do") {
    return (
      <div
        className={`flex items-start gap-3 mb-3 p-3 rounded-lg border-2 transition-colors ${
          content.checked
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {content.checked ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
          )}
        </div>
        <span className={`flex-1 ${
          content.checked
            ? "text-green-900 dark:text-green-100 font-medium"
            : "text-gray-700 dark:text-gray-300"
        }`}>
          <RichText text={content.rich_text} />
        </span>
      </div>
    );
  }

  // Toggle (menu déroulant)
  if (type === "toggle") {
    return (
      <div className="mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full text-left py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            <RichText text={content.rich_text} />
          </span>
        </button>
        {isOpen && block.children && block.children.length > 0 && (
          <div className="ml-6 mt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {block.children.map((child: any) => (
              <NotionBlock key={child.id} block={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Callout (encadré avec icône)
  if (type === "callout") {
    const icon = content.icon?.emoji || "📌";
    const color = content.color || "gray_background";

    let bgColor = "bg-gray-50 dark:bg-gray-800 border-gray-300";
    let IconComponent = Info;

    if (color.includes("blue")) {
      bgColor = "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700";
      IconComponent = Info;
    } else if (color.includes("yellow")) {
      bgColor = "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700";
      IconComponent = Lightbulb;
    } else if (color.includes("red")) {
      bgColor = "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700";
      IconComponent = AlertCircle;
    } else if (color.includes("orange")) {
      bgColor = "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700";
      IconComponent = AlertTriangle;
    } else if (color.includes("green")) {
      bgColor = "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700";
    }

    return (
      <div className={`flex gap-3 p-4 mb-4 rounded-lg border ${bgColor}`}>
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <RichText text={content.rich_text} />
          {block.children && block.children.length > 0 && (
            <div className="mt-2">
              {block.children.map((child: any) => (
                <NotionBlock key={child.id} block={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Code
  if (type === "code") {
    const language = content.language || "plain text";
    const code = content.rich_text.map((t: any) => t.plain_text).join("");

    return (
      <div className="mb-4">
        <div className="bg-gray-900 rounded-t px-4 py-2 text-xs text-gray-400 font-mono">
          {language}
        </div>
        <pre className="bg-gray-950 text-gray-100 p-4 rounded-b overflow-x-auto">
          <code className="font-mono text-sm">{code}</code>
        </pre>
      </div>
    );
  }

  // Quote (citation)
  if (type === "quote") {
    return (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 mb-4 italic text-gray-700 dark:text-gray-300">
        <RichText text={content.rich_text} />
      </blockquote>
    );
  }

  // Divider (séparateur)
  if (type === "divider") {
    return <hr className="my-6 border-gray-300 dark:border-gray-700" />;
  }

  // Image
  if (type === "image") {
    const url = content.file?.url || content.external?.url;
    const caption = content.caption?.[0]?.plain_text;

    return (
      <figure className="mb-4">
        {url && (
          <div className="relative w-full h-auto">
            <Image
              src={url}
              alt={caption || "Image"}
              width={800}
              height={600}
              className="rounded-lg w-full h-auto"
              unoptimized
            />
          </div>
        )}
        {caption && (
          <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Table
  if (type === "table") {
    const hasHeader = content.has_column_header;
    const headerRow = hasHeader && block.children?.[0];
    const bodyRows = hasHeader ? block.children?.slice(1) : block.children;

    return (
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          {hasHeader && headerRow && (
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {headerRow.table_row?.cells?.map((cell: any, j: number) => (
                  <th
                    key={j}
                    className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left"
                  >
                    <RichText text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows?.map((row: any) => (
              <tr key={row.id}>
                {row.table_row?.cells?.map((cell: any, j: number) => (
                  <td
                    key={j}
                    className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left"
                  >
                    <RichText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Equation
  if (type === "equation") {
    return (
      <div className="my-4 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono text-center">
        {content.expression}
      </div>
    );
  }

  // Bookmark
  if (type === "bookmark") {
    return (
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-4 p-4 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="text-blue-600 dark:text-blue-400 font-medium">
          {content.url}
        </div>
        {content.caption && content.caption.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <RichText text={content.caption} />
          </div>
        )}
      </a>
    );
  }

  // Bloc non supporté
  return (
    <div className="mb-2 text-gray-400 text-sm italic">
      [Bloc {type} non supporté]
    </div>
  );
}

/**
 * Composant pour afficher une liste de blocs Notion
 */
export function NotionBlockList({ blocks }: { blocks: any[] }) {
  if (!blocks || blocks.length === 0) {
    return <div className="text-gray-500">Aucun contenu</div>;
  }

  // Grouper les éléments de liste consécutifs
  const groupedBlocks: any[] = [];
  let currentList: any[] = [];
  let currentListType: string | null = null;

  blocks.forEach((block) => {
    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      if (currentListType !== block.type) {
        if (currentList.length > 0) {
          groupedBlocks.push({ type: currentListType, items: currentList });
          currentList = [];
        }
        currentListType = block.type;
      }
      currentList.push(block);
    } else {
      if (currentList.length > 0) {
        groupedBlocks.push({ type: currentListType, items: currentList });
        currentList = [];
        currentListType = null;
      }
      groupedBlocks.push(block);
    }
  });

  // Ajouter la dernière liste si elle existe
  if (currentList.length > 0) {
    groupedBlocks.push({ type: currentListType, items: currentList });
  }

  return (
    <div className="space-y-1">
      {groupedBlocks.map((item, index) => {
        if (item.type === "bulleted_list_item") {
          return (
            <ul key={index} className="mb-4">
              {item.items.map((block: any) => (
                <NotionBlock key={block.id} block={block} />
              ))}
            </ul>
          );
        } else if (item.type === "numbered_list_item") {
          return (
            <ol key={index} className="mb-4">
              {item.items.map((block: any) => (
                <NotionBlock key={block.id} block={block} />
              ))}
            </ol>
          );
        } else {
          return <NotionBlock key={item.id} block={item} />;
        }
      })}
    </div>
  );
}
