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
    return res.status(500).json({ error: 'Supabase credentials not configured.' });
  }

  // UI (Vercel) sends a trade request here
  if (req.method === 'POST') {
    const tradeData = req.body;
    
    const { data: command, error: insertError } = await supabase
      .from('mt5_commands')
      .insert({
          action: tradeData.type, // Mapping 'type' from UI to 'action' in DB
          symbol: tradeData.symbol,
          lot: parseFloat(tradeData.lot),
          executed: false,
          created_at: new Date().toISOString()
      })
      .select();

    if (insertError) return res.status(500).json({ error: insertError.message });

    return res.status(200).json({ status: 'queued', message: 'Ordem persistida na nuvem.', command: command?.[0] });
  }

  // Local Connector marks commands as EXECUTED here
  if (req.method === 'GET') {
    const { action, id } = req.query;
    
    if (action === 'mark_executed' && id) {
        const { error } = await supabase
          .from('mt5_commands')
          .update({ executed: true })
          .eq('id', id);
          
        return res.status(200).json({ status: error ? 'error' : 'updated' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
