-- Videos are shown from YouTube only; the media bucket accepts photos and PDFs.
update storage.buckets
set allowed_mime_types = array['image/*', 'application/pdf']
where id = 'agratha-media';
