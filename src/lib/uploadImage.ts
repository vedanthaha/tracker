import { supabase } from './supabase';

/**
 * Uploads an image asset for a note and records its metadata.
 *
 * @param noteId - Identifier of the note associated with the image
 * @returns The asset identifier, public URL, image dimensions, and original filename
 * @throws If the user is unauthenticated, the file type or size is invalid, or upload or metadata insertion fails
 */
export async function uploadImageAsset(file: File, noteId: string): Promise<{ assetId: string, publicUrl: string, width: number, height: number, alt: string }> {
  // 1. Get user id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const userId = user.id;

  // 2. Validate file
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error(`File is too large. Max size is 10MB.`);
  }

  // 3. Create asset ID and path
  const assetId = crypto.randomUUID();
  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/${noteId}/${assetId}.${ext}`;

  // 4. Get image dimensions
  const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });

  // 5. Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('note-assets')
    .upload(path, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 6. Create note_assets record
  const { error: dbError } = await supabase.from('note_assets').insert({
    id: assetId,
    note_id: noteId,
    user_id: userId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    width: dimensions.width,
    height: dimensions.height
  });

  if (dbError) {
    // If DB fails, we should probably delete the storage object, but let's just log for now
    console.error("Failed to insert note_assets record", dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  // 7. Get public URL
  const { data: urlData } = supabase.storage.from('note-assets').getPublicUrl(path);

  return {
    assetId,
    publicUrl: urlData.publicUrl,
    width: dimensions.width,
    height: dimensions.height,
    alt: file.name
  };
}
