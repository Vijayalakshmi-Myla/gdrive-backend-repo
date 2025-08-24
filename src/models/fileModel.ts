import { supabaseAdmin } from '../config/db.js';

export type FileRow = {
  id: string;
  name: string;
  user_id: string;
  folder_id: string | null;
  storage_bucket: string;
  storage_path: string;
  size: number;
  mime_type: string;
  checksum: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const FileModel = {
  async create(f: Omit<FileRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .insert(f)
      .select('*')
      .single();
    if (error) throw error;
    return data as FileRow;
  },

  async byId(id: string) {
    const { data, error } = await supabaseAdmin.from('files').select('*').eq('id', id).single();
    if (error) return null;
    return data as FileRow;
  },

  async listByFolder({ userId, folderId, limit = 50, offset = 0 }: { userId: string; folderId: string | null; limit?: number; offset?: number }) {
    const q = supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    const { data, error } = folderId ? await q.eq('folder_id', folderId).range(offset, offset + limit - 1) : await q.is('folder_id', null).range(offset, offset + limit - 1);
    if (error) throw error;
    return data as FileRow[];
  },

  async rename(id: string, name: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update({ name })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as FileRow;
  },

  async move(id: string, folderId: string | null) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update({ folder_id: folderId })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as FileRow;
  },

  async softDelete(id: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as FileRow;
  },

  async restore(id: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update({ deleted_at: null })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as FileRow;
  }
};

