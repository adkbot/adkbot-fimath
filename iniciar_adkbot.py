"""
╔══════════════════════════════════════════════════════════════╗
║          ADKBOT QUANTUM PRO - LAUNCHER v2.0                  ║
║          Auto-conexão MT5 + Sincronização Cloud              ║
╚══════════════════════════════════════════════════════════════╝
"""

import os
import sys
import time
import json
import glob
import threading
import urllib.request
import urllib.error

# ── Cores ANSI ──────────────────────────────────────────────────────────────
RESET  = "\x1b[0m"
BOLD   = "\x1b[1m"
RED    = "\x1b[91m"
GREEN  = "\x1b[92m"
YELLOW = "\x1b[93m"
BLUE   = "\x1b[94m"
MAGENTA= "\x1b[95m"
CYAN   = "\x1b[96m"
WHITE  = "\x1b[97m"
DIM    = "\x1b[2m"
BG_BLACK = "\x1b[40m"

# ── Configuração ──────────────────────────────────────────────────────────────
CLOUD_URL   = "https://adkbot-fimath.vercel.app"
SYNC_INTERVAL = 2

# ─────────────────────────────────────────────────────────────────────────────
def clear():
    os.system("cls" if os.name == "nt" else "clear")

def banner():
    clear()
    print(f"{CYAN}{BOLD}")
    print("  ╔══════════════════════════════════════════════════════════════╗")
    print("  ║                                                              ║")
    print("  ║        ██████╗ ██████╗ ██╗  ██╗██████╗  ██████╗ ████████╗   ║")
    print("  ║       ██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔═══██╗╚══██╔══╝   ║")
    print("  ║       ███████║██║  ██║█████╔╝ ██████╔╝██║   ██║   ██║      ║")
    print("  ║       ██╔══██║██║  ██║██╔═██╗ ██╔══██╗██║   ██║   ██║      ║")
    print("  ║       ██║  ██║██████╔╝██║  ██╗██████╔╝╚██████╔╝   ██║      ║")
    print("  ║       ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝      ║")
    print("  ║                                                              ║")
    print(f"  ║         {YELLOW}QUANTUM PRO  ·  Auto-Trading IA  ·  v2.0{CYAN}           ║")
    print("  ║                                                              ║")
    print("  ╚══════════════════════════════════════════════════════════════╝")
    print(f"{RESET}")
    print(f"  {DIM}Painel Online: {WHITE}{CLOUD_URL}{RESET}")
    print()

def step(icon, label, color=GREEN):
    print(f"  {color}{icon}{RESET}  {label}")

def loading(label, duration=0.8):
    frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
    end = time.time() + duration
    i = 0
    while time.time() < end:
        print(f"  {CYAN}{frames[i % len(frames)]}{RESET}  {label}...", end="\r")
        time.sleep(0.08)
        i += 1
    print("  " + " " * (len(label) + 10), end="\r")

def divider(title=""):
    if title:
        line = f"  {DIM}{'─' * 10}  {YELLOW}{title}{DIM}  {'─' * (45 - len(title))}─{RESET}"
    else:
        line = f"  {DIM}{'─' * 62}{RESET}"
    print(line)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Detectar instalações do MT5
# ─────────────────────────────────────────────────────────────────────────────
def find_mt5_terminals():
    """Busca terminais MT5 instalados no sistema"""
    paths = []
    
    # Caminhos fixos comuns
    known = [
        r"C:\Program Files\MetaTrader 5\terminal64.exe",
        r"C:\Program Files (x86)\MetaTrader 5\terminal64.exe",
        r"C:\MT5\terminal64.exe",
        r"C:\MetaTrader 5\terminal64.exe",
    ]
    for p in known:
        if os.path.exists(p):
            paths.append(p)
    
    # Busca em AppData (instâncias de corretoras)
    appdata_base = os.path.expandvars(r"%APPDATA%\MetaQuotes\Terminal")
    if os.path.exists(appdata_base):
        for terminal_dir in os.listdir(appdata_base):
            # In AppData, the terminal64.exe is not here, but the origin is
            origin_file = os.path.join(appdata_base, terminal_dir, "origin.txt")
            if os.path.exists(origin_file):
                with open(origin_file, "r", errors="ignore") as f:
                    exe_path = f.read().strip()
                if exe_path and os.path.exists(exe_path) and exe_path not in paths:
                    paths.append(exe_path)
    
    # Busca por glob em drives comuns
    for drive in ["C:", "D:"]:
        results = glob.glob(rf"{drive}\**\terminal64.exe", recursive=True)
        for r in results:
            if r not in paths:
                paths.append(r)
    
    return paths

# ─────────────────────────────────────────────────────────────────────────────
# 2. Cloud Sync
# ─────────────────────────────────────────────────────────────────────────────
def push_to_cloud(data: dict):
    """Envia dados de status para o painel online via Vercel API"""
    try:
        payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            f"{CLOUD_URL}/api/sync",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            result = json.loads(resp.read().decode())
            return result.get("commands", [])
    except Exception:
        return []

def mark_executed(cmd_id):
    try:
        req = urllib.request.Request(
            f"{CLOUD_URL}/api/trade?action=mark_executed&id={cmd_id}",
            method="GET"
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────────────────
# 3. Bridge principal (sem coloração – apenas funcional)
# ─────────────────────────────────────────────────────────────────────────────
def resolve_symbol(mt5_mod, symbol):
    if mt5_mod.symbol_select(symbol, True):
        return symbol
    syms = mt5_mod.symbols_get()
    if syms:
        for s in syms:
            if s.name.startswith(symbol):
                if mt5_mod.symbol_select(s.name, True):
                    return s.name
    return None

def execute_cloud_command(mt5_mod, cmd):
    try:
        action     = cmd.get("action", "").upper()
        raw_symbol = cmd.get("symbol", "EURUSD")
        lot        = float(cmd.get("lot", 0.01))
        symbol     = resolve_symbol(mt5_mod, raw_symbol)
        if not symbol:
            return

        order_type = mt5_mod.ORDER_TYPE_BUY if action in ("BUY","COMPRA") else mt5_mod.ORDER_TYPE_SELL
        tick = mt5_mod.symbol_info_tick(symbol)
        if not tick:
            return

        price = tick.ask if order_type == mt5_mod.ORDER_TYPE_BUY else tick.bid
        info  = mt5_mod.symbol_info(symbol)
        sl_d  = cmd.get("sl", 30) * (info.point * 10 if info else 0.0001)
        tp_d  = cmd.get("tp", 60) * (info.point * 10 if info else 0.0001)
        sl    = price - sl_d if order_type == mt5_mod.ORDER_TYPE_BUY else price + sl_d
        tp    = price + tp_d if order_type == mt5_mod.ORDER_TYPE_BUY else price - tp_d
        digits = info.digits if info else 5

        request = {
            "action":       mt5_mod.TRADE_ACTION_DEAL,
            "symbol":       symbol,
            "volume":       lot,
            "type":         order_type,
            "price":        price,
            "sl":           round(sl, digits),
            "tp":           round(tp, digits),
            "magic":        123456,
            "comment":      "ADKBOT CLOUD",
            "type_time":    mt5_mod.ORDER_TIME_GTC,
            "type_filling": mt5_mod.ORDER_FILLING_IOC,
        }
        result = mt5_mod.order_send(request)
        if result.retcode == mt5_mod.TRADE_RETCODE_DONE:
            print(f"  {GREEN}✔{RESET}  Ordem executada: {symbol} {action} lot={lot}")
        else:
            print(f"  {RED}✘{RESET}  Ordem falhou: {result.comment}")
    except Exception as e:
        print(f"  {RED}✘{RESET}  Erro ao executar ordem: {e}")

def run_bridge(mt5_mod, mt5_path=None):
    """Loop principal de sincronização com MT5 e Cloud"""
    print()
    divider("INICIANDO BRIDGE")

    step("●", "Conectando ao MetaTrader 5...", CYAN)

    if mt5_path:
        ok = mt5_mod.initialize(path=mt5_path)
    else:
        ok = mt5_mod.initialize()

    if not ok:
        print(f"\n  {RED}✘  Falha ao conectar! Certifique-se que o MT5 está aberto.{RESET}")
        input(f"\n  {DIM}Pressione ENTER para sair...{RESET}")
        return

    acc = mt5_mod.account_info()
    if acc is None:
        print(f"\n  {RED}✘  Não foi possível obter dados da conta. Verifique seu login no MT5.{RESET}")
        mt5_mod.shutdown()
        input(f"\n  {DIM}Pressione ENTER para sair...{RESET}")
        return

    print(f"\n  {GREEN}✔{RESET}  {BOLD}Conectado com sucesso!{RESET}")
    print()
    print(f"  {DIM}┌────────────────────────────────────────────┐{RESET}")
    print(f"  {DIM}│{RESET}  👤  Conta    : {WHITE}{BOLD}{acc.login}{RESET}")
    print(f"  {DIM}│{RESET}  🏷️  Nome     : {WHITE}{acc.name}{RESET}")
    print(f"  {DIM}│{RESET}  🏦  Corretora: {WHITE}{acc.server}{RESET}")
    print(f"  {DIM}│{RESET}  💰  Saldo    : {GREEN}{BOLD}$ {acc.balance:,.2f}{RESET}")
    print(f"  {DIM}│{RESET}  📊  Capital  : {GREEN}$ {acc.equity:,.2f}{RESET}")
    print(f"  {DIM}└────────────────────────────────────────────┘{RESET}")
    print()

    # Push inicial para a nuvem
    step("↑", f"Sincronizando com painel online: {DIM}{CLOUD_URL}{RESET}", CYAN)
    conn_data = {
        "type": "connection_success",
        "login": acc.login, "name": acc.name,
        "server": acc.server, "balance": acc.balance, "equity": acc.equity
    }
    push_to_cloud(conn_data)
    print(f"  {GREEN}✔{RESET}  {BOLD}Painel sincronizado!{RESET}  Abra {CYAN}{CLOUD_URL}{RESET} no navegador.\n")

    divider("MONITORAMENTO ATIVO")
    print(f"  {DIM}Atualizando a cada {SYNC_INTERVAL}s  │  Ctrl+C para encerrar{RESET}\n")

    cycle = 0
    try:
        while True:
            cycle += 1
            a = mt5_mod.account_info()
            if not a:
                time.sleep(SYNC_INTERVAL)
                continue

            positions = mt5_mod.positions_get() or []
            pos_list = []
            for p in positions:
                pos_list.append({
                    "ticket": p.ticket, "symbol": p.symbol,
                    "type": "BUY" if p.type == mt5_mod.POSITION_TYPE_BUY else "SELL",
                    "volume": p.volume, "profit": p.profit,
                    "price_open": p.price_open, "sl": p.sl, "tp": p.tp
                })

            # Histórico XAUUSD
            sym = resolve_symbol(mt5_mod, "XAUUSD") or resolve_symbol(mt5_mod, "EURUSD")
            history = []
            if sym:
                rates = mt5_mod.copy_rates_from_pos(sym, mt5_mod.TIMEFRAME_M2, 0, 100)
                if rates is not None:
                    for r in rates:
                        history.append({"time": int(r[0]), "open": float(r[1]),
                                        "high": float(r[2]), "low": float(r[3]), "close": float(r[4])})

            status = {
                "type": "status",
                "balance": a.balance, "equity": a.equity,
                "profit": round(a.profit, 2),
                "name": a.name, "server": a.server,
                "positions": pos_list, "history": history, "calendar": []
            }

            # Sincroniza com cloud
            cmds = push_to_cloud(status)

            # Status visual na linha
            n_pos = len(pos_list)
            profit_color = GREEN if a.profit >= 0 else RED
            sync_dot = f"{GREEN}●{RESET}" if cycle % 2 == 0 else f"{DIM}●{RESET}"
            print(
                f"  {sync_dot}  "
                f"Saldo: {GREEN}${a.balance:,.2f}{RESET}  │  "
                f"Capital: {GREEN}${a.equity:,.2f}{RESET}  │  "
                f"P&L: {profit_color}${a.profit:+.2f}{RESET}  │  "
                f"Ordens: {YELLOW}{n_pos}{RESET}  │  "
                f"{DIM}Sync #{cycle}{RESET}     ",
                end="\r"
            )

            # Executar comandos recebidos da nuvem
            for cmd in cmds:
                print()
                step("⚡", f"Ordem recebida do painel: {cmd.get('action')} {cmd.get('symbol')}", YELLOW)
                execute_cloud_command(mt5_mod, cmd)
                mark_executed(cmd.get("id"))

            time.sleep(SYNC_INTERVAL)

    except KeyboardInterrupt:
        print(f"\n\n  {YELLOW}⚠{RESET}  Encerrando bridge...")
    finally:
        mt5_mod.shutdown()
        print(f"  {GREEN}✔{RESET}  Desconectado do MT5. Até logo!\n")


# ─────────────────────────────────────────────────────────────────────────────
# 4. MENU PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
def main():
    banner()
    divider("VERIFICAÇÃO DO SISTEMA")
    loading("Verificando dependências", 0.6)

    # Verifica se MetaTrader5 está instalado
    try:
        import MetaTrader5 as mt5
        step("✔", "MetaTrader5 API encontrada", GREEN)
    except ImportError:
        step("✘", "Biblioteca MetaTrader5 não instalada!", RED)
        print(f"\n  {YELLOW}Para instalar, execute:{RESET}")
        print(f"  {DIM}pip install MetaTrader5{RESET}\n")
        input(f"  {DIM}Pressione ENTER para sair...{RESET}")
        return

    loading("Verificando conexão com painel online", 0.8)
    try:
        req = urllib.request.Request(f"{CLOUD_URL}/api/sync", method="GET")
        urllib.request.urlopen(req, timeout=5)
        step("✔", f"Painel online acessível: {DIM}{CLOUD_URL}{RESET}", GREEN)
    except Exception:
        step("⚠", f"Painel offline ou sem resposta (continuando...)", YELLOW)

    print()
    divider("SELEÇÃO DO TERMINAL MT5")
    print()
    loading("Buscando terminais MetaTrader 5 instalados", 1.2)

    terminals = find_mt5_terminals()
    
    print(f"  {BOLD}TERMINAIS META TRADER 5 ENCONTRADOS:{RESET}")
    print()

    if terminals:
        for i, path in enumerate(terminals, 1):
            broker = os.path.basename(os.path.dirname(path))
            print(f"    {CYAN}[{i}]{RESET}  {broker}  {DIM}{path}{RESET}")
    else:
        print(f"    {DIM}Nenhum terminal encontrado automaticamente.{RESET}")

    print(f"    {CYAN}[0]{RESET}  Detecção Automática (MT5 já aberto)")
    print(f"    {RED}[X]{RESET}  Sair")
    print()

    while True:
        try:
            escolha = input(f"  {YELLOW}Opção:{RESET} ").strip().lower()
        except KeyboardInterrupt:
            print()
            return

        if escolha == "x" or escolha == "sair":
            print(f"\n  {DIM}Saindo...{RESET}")
            return

        if escolha == "0":
            mt5_path = None
            step("→", "Usando detecção automática (MT5 deve estar aberto)", CYAN)
            break

        try:
            idx = int(escolha)
            if 1 <= idx <= len(terminals):
                mt5_path = terminals[idx - 1]
                step("→", f"Terminal selecionado: {DIM}{mt5_path}{RESET}", CYAN)
                break
            else:
                print(f"  {RED}Opção inválida. Tente novamente.{RESET}")
        except ValueError:
            if escolha == "":
                # Default: auto-detect
                mt5_path = None
                step("→", "Usando detecção automática", CYAN)
                break
            print(f"  {RED}Opção inválida. Use um número ou X para sair.{RESET}")

    print()
    run_bridge(mt5, mt5_path)
    input(f"  {DIM}Pressione ENTER para fechar...{RESET}")


if __name__ == "__main__":
    main()
