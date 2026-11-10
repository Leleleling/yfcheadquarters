import { supabase } from './supabase';

/** 上传聊天语音/文件到私有桶 chat，返回文件路径（path），不返回完整 URL。 */
export async function uploadChatMedia(file: File, conversationKey: string): Promise<string> {
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${conversationKey}/${Date.now()}-${Math.random().toString(36).slice(2)}_${safeName}`;
  const { data, error } = await supabase.storage.from('chat').upload(path, file);
  if (error) throw error;
  return data.path;
}

/** 私有桶文件需用临时签名链接访问（1 小时有效）。 */
export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('chat').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
