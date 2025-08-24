import type { Response } from 'express';
import { supabaseAdmin } from '../config/db.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { FileModel } from '../models/fileModel.js';
import { ENV } from '../config/env.js';
import crypto from 'crypto';
import { buildOffsetPagination, decodeCursor, encodeCursor } from '../utils/pagination.js';

export async function listFiles(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const folderId = (req.query.folderId as string) ?? null;
  const { limit = 50, page = 1 } = (req.query as any) || {};
  const { limit: l, offset } = buildOffsetPagination({ limit: Number(limit), page: Number(page) });
  const rows = await FileModel.listByFolder({ userId, folderId, limit: l, offset });
  res.json({ items: rows, page: Number(page), limit: l });
}

export async function listFilesKeyset(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const folderId = (req.query.folderId as string) ?? null;
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const cursor = decodeCursor((req.query.cursor as string) || null);

  let query = supabaseAdmin
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (folderId) query = query.eq('folder_id', folderId); else query = query.is('folder_id', null);
  if (cursor) {
    // keyset: created_at < cursor.created_at OR (created_at = cursor.created_at AND id < cursor.id)
    query = query.lt('created_at', cursor.created_at).or(`created_at.eq.${cursor.created_at},id.lt.${cursor.id}`);
  }
  const { data, error } = await query.limit(limit);
  if (error) throw error;
  const nextCursor = data && data.length ? encodeCursor({ created_at: data[data.length - 1].created_at, id: data[data.length - 1].id }) : null;
  res.json({ items: data, nextCursor });
}

export async function uploadFile(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const folderId = (req.body.folderId as string) || null;
  // multer puts file in req.file
  const file = (req as any).file as Express.Multer.File;
  if (!file) return res.status(400).json({ error: 'No file' });

  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const storagePath = `${userId}/${Date.now()}_${file.originalname}`;

  // upload to Supabase storage
  const storageBucket = ENV.STORAGE_BUCKET ?? '';
  const { error: upErr } = await supabaseAdmin.storage.from(storageBucket).upload(storagePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });
  if (upErr) return res.status(400).json({ error: upErr.message });

  // save DB row
  const row = await FileModel.create({
    name: file.originalname,
    user_id: userId,
    folder_id: folderId,
    storage_bucket: ENV.STORAGE_BUCKET ?? '',
    storage_path: storagePath,
    size: file.size,
    mime_type: file.mimetype,
    checksum
  });

  // grant ownership
  await supabaseAdmin.from('item_permissions').insert({ item_type: 'file', item_id: row.id, user_id: userId, role: 'owner' });

  res.status(201).json(row);
}

export async function signedUrl(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const userId = req.user!.id;
  // check permission >= view
  const { data: perm } = await supabaseAdmin
    .from('item_permissions')
    .select('role')
    .eq('item_type','file').eq('item_id', id).eq('user_id', userId)
    .in('role', ['owner','edit','view'])
    .maybeSingle();
  if (!perm) return res.status(403).json({ error: 'Forbidden' });

  const file = await FileModel.byId(id);
  if (!file) return res.status(404).json({ error: 'Not found' });

  const { data, error } = await supabaseAdmin.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, ENV.SIGN_URL_EXPIRES);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ url: data.signedUrl, expiresIn: ENV.SIGN_URL_EXPIRES });
}

export async function renameFile(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = req.params.id;
  const { name } = req.body as { name: string };
  const { data: perm } = await supabaseAdmin.from('item_permissions').select('role').eq('item_type','file').eq('item_id', id).eq('user_id', userId).in('role',['owner','edit']).maybeSingle();
  if (!perm) return res.status(403).json({ error: 'Forbidden' });

  const updated = await FileModel.rename(id, name);
  res.json(updated);
}

export async function moveFile(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = req.params.id;
  const { folderId } = req.body as { folderId: string | null };
  const { data: perm } = await supabaseAdmin.from('item_permissions').select('role').eq('item_type','file').eq('item_id', id).eq('user_id', userId).in('role',['owner','edit']).maybeSingle();
  if (!perm) return res.status(403).json({ error: 'Forbidden' });
  const updated = await FileModel.move(id, folderId);
  res.json(updated);
}

export async function deleteFile(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = req.params.id;
  const { data: perm } = await supabaseAdmin.from('item_permissions').select('role').eq('item_type','file').eq('item_id', id).eq('user_id', userId).in('role',['owner']).maybeSingle();
  if (!perm) return res.status(403).json({ error: 'Owner required' });
  const updated = await FileModel.softDelete(id);
  res.json(updated);
}

export async function restoreFile(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const id = req.params.id;
  const { data: perm } = await supabaseAdmin.from('item_permissions').select('role').eq('item_type','file').eq('item_id', id).eq('user_id', userId).in('role',['owner']).maybeSingle();
  if (!perm) return res.status(403).json({ error: 'Owner required' });
  const updated = await FileModel.restore(id);
  res.json(updated);
}
