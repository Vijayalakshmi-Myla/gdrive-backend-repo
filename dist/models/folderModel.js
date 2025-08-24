import { supabaseAdmin } from '../config/db';
export const FolderModel = {
    async create({ name, userId, parentId }) {
        const { data, error } = await supabaseAdmin
            .from('folders')
            .insert({ name, user_id: userId, parent_id: parentId ?? null })
            .select('*')
            .single();
        if (error)
            throw error;
        // read back to get computed path from trigger
        const { data: row, error: e2 } = await supabaseAdmin.from('folders').select('*').eq('id', data.id).single();
        if (e2)
            throw e2;
        return row;
    },
    async byId(id) {
        const { data, error } = await supabaseAdmin.from('folders').select('*').eq('id', id).single();
        if (error)
            return null;
        return data;
    },
    async listChildren({ userId, parentId, limit = 50, offset = 0 }) {
        const { data, error } = await supabaseAdmin
            .from('folders')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .eq('parent_id', parentId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw error;
        return data;
    },
    async rename(id, name) {
        const { data, error } = await supabaseAdmin
            .from('folders')
            .update({ name })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw error;
        return data;
    },
    async move(id, newParentId) {
        // update parent_id; trigger recomputes path on insert only, so recompute path here via RPC
        // We'll read parent path and set new path
        const { data: parent, error: pErr } = newParentId
            ? await supabaseAdmin.from('folders').select('path').eq('id', newParentId).single()
            : { data: { path: 'root' }, error: null };
        if (pErr)
            throw pErr;
        const { data: updated, error } = await supabaseAdmin
            .from('folders')
            .update({ parent_id: newParentId })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw error;
        // Recompute path for the folder and all descendants in SQL using ltree operations
        const { error: e2 } = await supabaseAdmin.rpc('repath_folder_and_descendants', { p_folder_id: id, p_new_parent_path: parent.path });
        if (e2)
            throw e2;
        return updated;
    },
    async softDelete(id) {
        const { data, error } = await supabaseAdmin
            .from('folders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw error;
        return data;
    },
    async restore(id) {
        const { data, error } = await supabaseAdmin
            .from('folders')
            .update({ deleted_at: null })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw error;
        return data;
    }
};
