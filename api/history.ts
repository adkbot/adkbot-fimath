import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.URL__SUPABASE || 'https://cygechyguddzmubhzdql.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z2VjaHlndWRkem11Ymh6ZHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDM3MzcsImV4cCI6MjA5MDM3OTczN30.EgQkME9ZNhKiUk_G1lIZ5nBcdmAA9m95wieceXIt158';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Config missing' });

  // Get history from the latest sync payload in status table
  const { data, error } = await supabase
    .from('mt5_status')
    .select('status')
    .eq('id', 1)
    .single();

  if (error || !data?.status?.history) {
    return res.status(200).json([]); // Return empty history if not found
  }

  return res.status(200).json(data.status.history);
}
