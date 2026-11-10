import { supabase } from './supabase';

/** 上传聊天语音/文件到 Supabase Storage 的 chat 桶，返回公开 URL。 */
export async function uploadChatMedia(file: File, conversationKey: string): Promise<string> {
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${conversationKey}/${Date.now()}-${Math.random().toString(36).slice(2)}_${safeName}`;
  const { data, error } = await supabase.storage.from('chat').upload(path, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('chat').getPublicUrl(data.path);
  return urlData.publicUrl;
}
