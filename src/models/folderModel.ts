import { supabaseAdmin } from '../config/db.js';

export type Folder = {
  id: string;
  name: string;
  user_id: string;
  parent_id: string | null;
  path: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const FolderModel = {
  async create({ name, userId, parentId }: { name: string; userId: string; parentId?: string | null }) {
    const { data, error } = await supabaseAdmin
      .from('folders')
      .insert({ name, user_id: userId, parent_id: parentId ?? null })
      .select('*')
      .single();
    if (error) throw error;

    // read back to get computed path from trigger
    const { data: row, error: e2 } = await supabaseAdmin.from('folders').select('*').eq('id', data.id).single();
    if (e2) throw e2;
    return row as Folder;
  },

  async byId(id: string) {
    const { data, error } = await supabaseAdmin.from('folders').select('*').eq('id', id).single();
    if (error) return null;
    return data as Folder;
  },

  async listChildren({ userId, parentId, limit = 50, offset = 0 }: { userId: string; parentId: string | null; limit?: number; offset?: number }) {
    const { data, error } = await supabaseAdmin
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data as Folder[];
  },

  async rename(id: string, name: string) {
    const { data, error } = await supabaseAdmin
      .from('folders')
      .update({ name })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Folder;
  },

  async move(id: string, newParentId: string | null) {
    // update parent_id; trigger recomputes path on insert only, so recompute path here via RPC
    // We'll read parent path and set new path
    const { data: parent, error: pErr } = newParentId
      ? await supabaseAdmin.from('folders').select('path').eq('id', newParentId).single()
      : { data: { path: 'root' }, error: null } as any;
    if (pErr) throw pErr;

    const { data: updated, error } = await supabaseAdmin
      .from('folders')
      .update({ parent_id: newParentId })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    // Recompute path for the folder and all descendants in SQL using ltree operations
    const { error: e2 } = await supabaseAdmin.rpc('repath_folder_and_descendants', { p_folder_id: id, p_new_parent_path: parent.path as string });
    if (e2) throw e2;
    return updated as Folder;
  },

  async softDelete(id: string) {
    const { data, error } = await supabaseAdmin
      .from('folders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Folder;
  },

  async restore(id: string) {
    const { data, error } = await supabaseAdmin
      .from('folders')
      .update({ deleted_at: null })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Folder;
  }
};
