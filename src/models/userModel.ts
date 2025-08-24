import { supabaseAdmin } from '../config/db.js';

export type User = { id: string; email: string; password: string; name: string };

export const UserModel = {
  async create(email: string, password: string, name: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ email, password, name })
      .select('*')
      .single();
    if (error) throw error;
    return data as User;
  },

  async findByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data as User;
  },

  async findById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as User;
  }
};
