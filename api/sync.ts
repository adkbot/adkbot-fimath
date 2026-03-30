import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Suporta múltiplos nomes de variável de ambiente (legado + atual)
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.URL_SUPABASE ||       // Vercel: single underscore variant
  process.env.URL__SUPABASE ||      // legacy double underscore
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Debug: log env var presence (sem mostrar valores sensíveis)
  console.log('[sync] SUPABASE_URL configured:', !!SUPABASE_URL);
  console.log('[sync] SUPABASE_KEY configured:', !!SUPABASE_KEY);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[sync] Missing Supabase credentials!');
    console.error('[sync] Env vars available:', Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('URL')));
    return res.status(500).json({
      error: 'Supabase credentials not configured.',
      hint: 'Add SUPABASE_URL and SUPABASE_KEY to Vercel Environment Variables.',
      supabase_url_set: !!SUPABASE_URL,
      supabase_key_set: !!SUPABASE_KEY,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // --- POST: Recebe status do bridge local ---
  if (req.method === 'POST') {
    try {
      const statusData = req.body;
      if (!statusData) return res.status(400).json({ error: 'Body vazio' });

      // Upsert: garante que id=1 sempre existe
      const { error: upsertError } = await supabase
        .from('mt5_status')
        .upsert({
          id: 1,
          status: statusData,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (upsertError) {
        console.error('[sync POST] Upsert error:', JSON.stringify(upsertError));
        throw upsertError;
      }

      // Busca comandos pendentes
      const { data: commands, error: fetchError } = await supabase
        .from('mt5_commands')
        .select('*')
        .eq('executed', false)
        .order('created_at', { ascending: true })
        .limit(10);

      if (fetchError) {
        console.error('[sync POST] Fetch commands error:', JSON.stringify(fetchError));
        throw fetchError;
      }

      return res.status(200).json({ status: 'ok', commands: commands || [] });
    } catch (err: any) {
      console.error('[sync POST] Error:', err);
      return res.status(500).json({ error: err.message || 'Erro interno no POST' });
    }
  }

  // --- GET: Dashboard busca status do MT5 ---
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('mt5_status')
        .select('status, created_at')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('[sync GET] Error:', JSON.stringify(error));
        throw error;
      }

      if (!data || !data.status) {
        // Retorna estado "aguardando bridge" sem erro
        return res.status(200).json({
          type: 'waiting',
          message: 'Aguardando conexão do bridge local (iniciar_adkbot.py).'
        });
      }

      return res.status(200).json(data.status);
    } catch (err: any) {
      console.error('[sync GET] Error:', err);
      return res.status(500).json({ error: err.message || 'Erro interno no GET' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
