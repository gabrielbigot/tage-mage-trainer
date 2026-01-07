// Export Hybrid storage as the default storage
// - Questions: from Notion
// - Statistics/Sessions: from Supabase (with localStorage fallback)
//
// Alternatives:
// - Notion only: export { notionStorage as storage } from "./notion-storage-client";
// - Supabase only: export { supabaseStorage as storage } from "./supabase-storage";
// - localStorage only: export { localStorage as storage } from "./storage-local";

export { hybridStorage as storage } from "./storage-hybrid";
