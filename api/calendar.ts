import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.URL__SUPABASE || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Config missing' });

  // Get calendar from the latest sync payload in status table
  const { data, error } = await supabase
    .from('status_mt5')
    .select('status')
    .eq('id', 1)
    .single();

  if (error || !data?.status?.calendar) {
    return res.status(200).json([]); // Return empty calendar if not found
  }

  return res.status(200).json(data.status.calendar);
}
