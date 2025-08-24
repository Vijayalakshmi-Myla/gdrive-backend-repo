import dotenv from 'dotenv';
dotenv.config();
function requireEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env: ${name}`);
    return v;
}
export const ENV = {
    PORT: Number(process.env.PORT || 8080),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    SUPABASE_URL: requireEnv('SUPABASE_URL'),
    SUPABASE_ANON_KEY: requireEnv('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY,
    STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    SIGN_URL_EXPIRES: Number(process.env.SIGN_URL_EXPIRES)
};
