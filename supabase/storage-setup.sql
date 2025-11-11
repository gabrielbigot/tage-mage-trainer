-- Storage setup for question images
-- Execute this in your Supabase SQL Editor

-- Create a storage bucket for question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'question-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'question-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'question-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all images (since bucket is public)
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-images');
