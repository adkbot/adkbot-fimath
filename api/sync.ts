import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.URL__SUPABASE || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured in Vercel environment variables.' });
  }

  // --- POST: Update MT5 status from Local Connector ---
  if (req.method === 'POST') {
    const statusData = req.body;
    
    // 1. Update (upsert) status
    const { error: upsertError } = await supabase
      .from('status_mt5')
      .upsert({ id: 1, status: statusData, last_sync: new Date().toISOString() });

    if (upsertError) return res.status(500).json({ error: upsertError.message });

    // 2. Fetch pending commands to return them to the connector
    const { data: commands, error: fetchError } = await supabase
      .from('mt5_comandos')
      .select('*')
      .eq('executed', false);

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    return res.status(200).json({ status: 'ok', commands: commands || [] });
  }

  // --- GET: Fetch status for the Dashboard ---
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('status_mt5')
      .select('status')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data?.status || { type: 'log', message: 'Nenhum dado sincronizado ainda.' });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
