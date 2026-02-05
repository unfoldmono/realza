'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadPhoto(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { error: 'No file provided' }
  }

  if (!file.type?.startsWith('image/')) {
    return { error: 'Please upload an image file.' }
  }

  if (file.size > 12 * 1024 * 1024) {
    return { error: 'Image is too large (max 12MB).' }
  }

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }

  const guessed = file.name.includes('.') ? file.name.split('.').pop() : undefined
  const ext = (guessed || mimeToExt[file.type] || 'jpg').toLowerCase()

  const fileName = `${user.id}/${globalThis.crypto?.randomUUID?.() ?? Date.now()}.${ext}`

  const { data, error } = await supabase.storage.from('listing-photos').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (error) {
    return { error: error.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('listing-photos')
    .getPublicUrl(data.path)

  return { url: publicUrl }
}

export async function deletePhoto(url: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract path from URL
  const path = url.split('/listing-photos/')[1]
  if (!path) {
    return { error: 'Invalid photo URL' }
  }

  // Verify ownership (path starts with user id)
  if (!path.startsWith(user.id)) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase.storage
    .from('listing-photos')
    .remove([path])

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUploadUrl() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const fileName = `${user.id}/${Date.now()}`

  const { data, error } = await supabase.storage
    .from('listing-photos')
    .createSignedUploadUrl(fileName)

  if (error) {
    return { error: error.message }
  }

  return { 
    signedUrl: data.signedUrl,
    path: data.path,
  }
}
