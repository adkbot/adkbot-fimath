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
    try {
      const statusData = req.body;
      if (!statusData) return res.status(400).json({ error: 'Nenhum corpo de requisição enviado' });

      // 1. Update (upsert) status
      const { error: upsertError } = await supabase
        .from('mt5_status')
        .upsert({ 
          id: 1, 
          status: statusData, 
          created_at: new Date().toISOString() 
        });

      if (upsertError) throw upsertError;

      // 2. Fetch pending commands
      const { data: commands, error: fetchError } = await supabase
        .from('mt5_commands')
        .select('*')
        .eq('executed', false);

      if (fetchError) throw fetchError;

      return res.status(200).json({ status: 'ok', commands: commands || [] });
    } catch (err: any) {
      console.error('Error Sync POST:', err);
      return res.status(500).json({ error: err.message || 'Erro interno no POST' });
    }
  }

  // --- GET: Fetch status for the Dashboard ---
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('mt5_status')
        .select('status')
        .eq('id', 1)
        .maybeSingle(); // Better than .single()

      if (error) throw error;

      return res.status(200).json(data?.status || { type: 'log', message: 'Nenhum dado sincronizado ainda.' });
    } catch (err: any) {
      console.error('Error Sync GET:', err);
      return res.status(500).json({ error: err.message || 'Erro interno no GET' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
