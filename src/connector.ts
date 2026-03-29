import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pythonPath = 'python';
const scriptPath = path.join(__dirname, '..', 'bridge_mt5.py');

// Get your Vercel URL from .env or fallback
const CLOUD_URL = process.env.CLOUD_URL || 'https://adkbot-fimath.vercel.app';

let pythonProcess: any = null;

const startConnector = () => {
    console.clear();
    console.log("\x1b[35m%s\x1b[0m", "====================================================");
    console.log("\x1b[35m%s\x1b[0m", "          ADKBOT QUANTUM PRO CONNECTOR             ");
    console.log("\x1b[35m%s\x1b[0m", "====================================================");
    console.log(`[INFO] Sincronizando com Cloud: ${CLOUD_URL}\n`);
    
    pythonProcess = spawn(pythonPath, [scriptPath]);
    
    pythonProcess.stdout.on('data', async (data: any) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line.trim());
                
                if (json.type === 'log') {
                    console.log(`\x1b[36m[MT5 LOG]\x1b[0m ${json.message}`);
                }
                
                if (json.type === 'connection_success') {
                    console.log("\x1b[32m%s\x1b[0m", `[SUCESSO] Conectado ao MT5 - Conta: ${json.login} (${json.name})`);
                    console.log("\x1b[32m%s\x1b[0m", `[SUCESSO] Corretora: ${json.server}`);
                    console.log(`[INFO] Saldo Atual: $${json.balance}\n`);
                }

                if (json.type === 'error') {
                    console.log("\x1b[31m%s\x1b[0m", `[ERRO MT5] ${json.message}`);
                }

                if (json.type === 'status' || json.type === 'connection_success') {
                    // Sync to Cloud
                    const response = await fetch(`${CLOUD_URL}/api/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(json)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.commands && result.commands.length > 0) {
                            for (const cmd of result.commands) {
                                console.log("\x1b[33m%s\x1b[0m", `[CLOUD COMMAND] Recebido: ${cmd.action}`);
                                pythonProcess.stdin.write(JSON.stringify(cmd.data) + '\n');
                                
                                // Mark as executed
                                await fetch(`${CLOUD_URL}/api/trade?action=mark_executed&id=${cmd.id}`);
                            }
                        }
                    }
                }
            } catch (e) {
                // Not JSON, ignore
            }
        }
    });

    pythonProcess.stderr.on('data', (data: any) => {
        console.log("\x1b[31m%s\x1b[0m", `[SISTEMA] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code: any) => {
        console.log("\x1b[31m%s\x1b[0m", `[AVISO] Conexão com MT5 fechada (Código ${code}). Tentando reconectar...`);
        setTimeout(startConnector, 5000);
    });
};

startConnector();
