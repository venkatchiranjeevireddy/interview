import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY');

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
