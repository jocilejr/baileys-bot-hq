
-- Create storage bucket for automation media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('automation-media', 'automation-media', true);

-- Allow anyone to read files (public bucket)
CREATE POLICY "Public read access for automation media"
ON storage.objects FOR SELECT
USING (bucket_id = 'automation-media');

-- Allow anyone to upload files (temp: no auth required)
CREATE POLICY "Allow uploads to automation media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'automation-media');

-- Allow anyone to update files
CREATE POLICY "Allow updates to automation media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'automation-media');

-- Allow anyone to delete files
CREATE POLICY "Allow deletes from automation media"
ON storage.objects FOR DELETE
USING (bucket_id = 'automation-media');
