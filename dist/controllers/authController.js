import { UserModel } from '../models/userModel';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { z } from 'zod';
const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1)
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});
export async function register(req, res) {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, name } = parsed.data;
    const existing = await UserModel.findByEmail(email);
    if (existing)
        return res.status(400).json({ error: 'User already exists' });
    const hashed = await hashPassword(password);
    const user = await UserModel.create(email, hashed, name);
    const token = signToken({ id: user.id, email: user.email });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
}
export async function login(req, res) {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = await UserModel.findByEmail(email);
    if (!user)
        return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await comparePassword(password, user.password);
    if (!ok)
        return res.status(400).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
}
