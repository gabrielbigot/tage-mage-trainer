// Export Notion storage as the default storage (client-side version)
// Pour utiliser Supabase à la place, changez l'import ci-dessous
// Pour utiliser le localStorage, importez depuis "./storage-local"

export { notionStorage as storage } from "./notion-storage-client";

// Alternative: export { supabaseStorage as storage } from "./supabase-storage";
