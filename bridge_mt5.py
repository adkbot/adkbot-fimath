import MetaTrader5 as mt5
import sys
import json
import time
import threading
import os
import urllib.request
import urllib.error

# =============================================
# CONFIGURAÇÃO - Edite se necessário
# =============================================
CLOUD_URL = os.environ.get('CLOUD_URL', 'https://adkbot-fimath.vercel.app')
SYNC_INTERVAL = 2  # segundos entre cada sincronização

def send_json(data):
    """Auxiliary to send JSON to stdout"""
    try:
        print(json.dumps(data), flush=True)
    except:
        pass

def push_to_cloud(data: dict):
    """Push status data to Vercel cloud API"""
    try:
        url = f"{CLOUD_URL}/api/sync"
        payload = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode('utf-8'))
            # Check for pending commands from the cloud
            if result.get('commands'):
                return result['commands']
    except urllib.error.HTTPError as e:
        send_json({"type": "log", "message": f"[Cloud Sync] Erro HTTP {e.code}: {e.reason}"})
    except Exception as e:
        send_json({"type": "log", "message": f"[Cloud Sync] Erro: {str(e)}"})
    return []

def mark_command_executed(cmd_id):
    """Mark a cloud command as executed"""
    try:
        url = f"{CLOUD_URL}/api/trade?action=mark_executed&id={cmd_id}"
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=5) as response:
            pass
    except:
        pass

def resolve_symbol(symbol):
    """
    Tries to find the symbol in MT5, even with broker suffixes like .pro, .m, etc.
    Returns the corrected symbol name or None if not found.
    """
    # 1. Try exact match
    if mt5.symbol_select(symbol, True):
        return symbol
    
    # 2. Scan all symbols for a match with suffix
    symbols = mt5.symbols_get()
    if symbols:
        for s in symbols:
            if s.name.startswith(symbol):
                # Found a potential match (e.g., XAUUSD -> XAUUSD.pro)
                if mt5.symbol_select(s.name, True):
                    return s.name
    return None

def execute_trade_command(cmd):
    """Execute a trade command received from the cloud"""
    try:
        action = cmd.get('action', '').upper()
        raw_symbol = cmd.get('symbol', 'EURUSD')
        lot = float(cmd.get('lot', 0.01))
        
        symbol = resolve_symbol(raw_symbol)
        if not symbol:
            send_json({"type": "error", "message": f"Símbolo {raw_symbol} não encontrado para ordem em nuvem."})
            return
        
        order_type = mt5.ORDER_TYPE_BUY if action in ('BUY', 'COMPRA') else mt5.ORDER_TYPE_SELL
        tick = mt5.symbol_info_tick(symbol)
        if not tick:
            send_json({"type": "error", "message": f"Não foi possível obter preço de {symbol}"})
            return
        
        price = tick.ask if order_type == mt5.ORDER_TYPE_BUY else tick.bid
        info = mt5.symbol_info(symbol)
        
        # Simple SL/TP: 30 and 60 pips by default
        sl_dist = cmd.get('sl', 30) * info.point * 10 if info else 0.003
        tp_dist = cmd.get('tp', 60) * info.point * 10 if info else 0.006
        
        sl = price - sl_dist if order_type == mt5.ORDER_TYPE_BUY else price + sl_dist
        tp = price + tp_dist if order_type == mt5.ORDER_TYPE_BUY else price - tp_dist
        
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": lot,
            "type": order_type,
            "price": price,
            "sl": round(sl, info.digits if info else 5),
            "tp": round(tp, info.digits if info else 5),
            "magic": 123456,
            "comment": "ADKBOT CLOUD",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            send_json({"type": "error", "message": f"Ordem nuvem falhou: {result.comment}"})
        else:
            send_json({"type": "trade_success", "deal": result.deal, "order": result.order, "symbol": symbol})
    except Exception as e:
        send_json({"type": "error", "message": f"Erro ao executar ordem da nuvem: {str(e)}"})

def cmd_loop():
    """Reads commands from stdin and executes them (for local mode)"""
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        
        try:
            cmd_data = json.loads(line)
            action = cmd_data.get("action")
            
            if action == "get_history":
                raw_symbol = cmd_data.get("symbol")
                symbol = resolve_symbol(raw_symbol)
                
                if not symbol:
                    send_json({"type": "error", "message": f"Símbolo {raw_symbol} não encontrado no seu Broker."})
                    continue

                timeframe_str = cmd_data.get("timeframe", "M2")
                count = cmd_data.get("count", 50)
                
                tf_map = {
                    "M1": mt5.TIMEFRAME_M1, "M2": mt5.TIMEFRAME_M2, "M5": mt5.TIMEFRAME_M5,
                    "M15": mt5.TIMEFRAME_M15, "M30": mt5.TIMEFRAME_M30, "H1": mt5.TIMEFRAME_H1
                }
                tf = tf_map.get(timeframe_str, mt5.TIMEFRAME_M2)
                
                rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
                if rates is None:
                    err = mt5.last_error()
                    send_json({"type": "error", "message": f"Erro MT5 ({err[0]}): {err[1]} para {symbol}"})
                else:
                    rates_list = []
                    for r in rates:
                        rates_list.append({
                            "time": int(r[0]),
                            "open": float(r[1]),
                            "high": float(r[2]),
                            "low": float(r[3]),
                            "close": float(r[4]),
                            "tick_volume": int(r[5])
                        })
                    send_json({"type": "history", "symbol": raw_symbol, "resolved_symbol": symbol, "data": rates_list})

            elif action == "place_order":
                execute_trade_command(cmd_data)

        except Exception as e:
            send_json({"type": "error", "message": str(e)})

def main():
    send_json({"type": "log", "message": "CONECTANDO AO TERMINAL MT5..."})
    
    if not mt5.initialize():
        # Tenta caminhos comuns se falhar auto-detect
        common_paths = [
            "C:\\Program Files\\MetaTrader 5\\terminal64.exe",
            "C:\\MT5\\terminal64.exe",
            "C:\\Program Files (x86)\\MetaTrader 5\\terminal64.exe",
            "C:\\Users\\Usuario\\AppData\\Roaming\\MetaQuotes\\Terminal\\terminal64.exe",
        ]
        connected = False
        for path in common_paths:
            if os.path.exists(path) and mt5.initialize(path=path):
                connected = True
                break
        
        if not connected:
            send_json({"type": "error", "message": "ERRO: ABRA O SEU TERMINAL MT5 NO PC PARA CONECTAR."})
            sys.exit(1)

    account_info = mt5.account_info()
    if account_info is None:
        send_json({"type": "error", "message": "LOGIN FALHOU: VERIFIQUE SUA CONTA NO MT5."})
        mt5.shutdown()
        sys.exit(1)

    connection_data = {
        "type": "connection_success",
        "login": account_info.login,
        "name": account_info.name,
        "server": account_info.server,
        "balance": account_info.balance,
        "equity": account_info.equity
    }
    send_json(connection_data)
    
    # Push initial connection to cloud
    send_json({"type": "log", "message": f"Sincronizando com nuvem: {CLOUD_URL}..."})
    push_to_cloud(connection_data)
    send_json({"type": "log", "message": "✓ Conectado e sincronizado com a nuvem!"})
    
    # Start stdin command loop in a separate thread (for local mode)
    threading.Thread(target=cmd_loop, daemon=True).start()

    try:
        while True:
            acc = mt5.account_info()
            if acc:
                positions = mt5.positions_get()
                pos_list = []
                if positions:
                    for p in positions:
                        pos_list.append({
                            "ticket": p.ticket,
                            "symbol": p.symbol,
                            "type": "BUY" if p.type == mt5.POSITION_TYPE_BUY else "SELL",
                            "volume": p.volume,
                            "profit": p.profit,
                            "price_open": p.price_open,
                            "sl": p.sl,
                            "tp": p.tp
                        })

                # Fetch chart history for primary symbol
                symbol_for_history = resolve_symbol("XAUUSD") or resolve_symbol("EURUSD")
                history_data = []
                if symbol_for_history:
                    rates = mt5.copy_rates_from_pos(symbol_for_history, mt5.TIMEFRAME_M2, 0, 100)
                    if rates is not None:
                        for r in rates:
                            history_data.append({
                                "time": int(r[0]), "open": float(r[1]), "high": float(r[2]),
                                "low": float(r[3]), "close": float(r[4])
                            })

                status_data = {
                    "type": "status", 
                    "balance": acc.balance, 
                    "equity": acc.equity,
                    "profit": round(acc.profit, 2),
                    "name": acc.name,
                    "server": acc.server,
                    "positions": pos_list,
                    "history": history_data,
                    "calendar": []
                }
                
                # 1. Send to stdout (for local server mode)
                send_json(status_data)
                
                # 2. Push to cloud (for Vercel dashboard)
                pending_commands = push_to_cloud(status_data)
                
                # 3. Execute any pending cloud commands
                for cmd in pending_commands:
                    send_json({"type": "log", "message": f"[Cloud CMD] Executando: {cmd.get('action')} {cmd.get('symbol')}"})
                    execute_trade_command(cmd)
                    mark_command_executed(cmd.get('id'))

            time.sleep(SYNC_INTERVAL)
    except KeyboardInterrupt:
        pass
    finally:
        mt5.shutdown()
        send_json({"type": "log", "message": "Bridge encerrada."})

if __name__ == "__main__":
    main()
