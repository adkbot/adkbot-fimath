import MetaTrader5 as mt5
import sys
import json
import time
import threading

def send_json(data):
    """Auxiliary to send JSON to stdout"""
    try:
        print(json.dumps(data), flush=True)
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

def cmd_loop():
    """Reads commands from stdin and executes them"""
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
                
                # Map string timeframe to MT5 constant
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
                raw_symbol = cmd_data.get("symbol")
                symbol = resolve_symbol(raw_symbol)
                if not symbol:
                    send_json({"type": "error", "message": f"Símbolo {raw_symbol} não encontrado para ordem."})
                    continue

                type_str = cmd_data.get("type")
                lot = cmd_data.get("lot")
                sl = cmd_data.get("sl")
                tp = cmd_data.get("tp")
                
                order_type = mt5.ORDER_TYPE_BUY if type_str == "COMPRA" else mt5.ORDER_TYPE_SELL
                tick = mt5.symbol_info_tick(symbol)
                if not tick:
                    send_json({"type": "error", "message": f"Não foi possível obter preço atual de {symbol}"})
                    continue
                
                price = tick.ask if type_str == "COMPRA" else tick.bid
                
                request = {
                    "action": mt5.TRADE_ACTION_DEAL,
                    "symbol": symbol,
                    "volume": float(lot),
                    "type": order_type,
                    "price": price,
                    "sl": float(sl),
                    "tp": float(tp),
                    "magic": 123456,
                    "comment": "ADKBOT FIMATHE",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": mt5.ORDER_FILLING_IOC,
                }
                
                result = mt5.order_send(request)
                if result.retcode != mt5.TRADE_RETCODE_DONE:
                    send_json({"type": "error", "message": f"Ordem falhou: {result.comment}"})
                else:
                    send_json({"type": "trade_success", "deal": result.deal, "order": result.order, "symbol": symbol})

        except Exception as e:
            send_json({"type": "error", "message": str(e)})

def main():
    send_json({"type": "log", "message": "CONECTANDO AO TERMINAL MT5..."})
    
    if not mt5.initialize():
        # Tenta caminhos comuns se falhar auto-detect
        common_paths = [
            "C:\\Program Files\\MetaTrader 5\\terminal64.exe",
            "C:\\MT5\\terminal64.exe",
            "C:\\Program Files (x86)\\MetaTrader 5\\terminal64.exe"
        ]
        connected = False
        for path in common_paths:
            if mt5.initialize(path=path):
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

    send_json({
        "type": "connection_success",
        "login": account_info.login,
        "name": account_info.name,
        "server": account_info.server,
        "balance": account_info.balance,
        "equity": account_info.equity
    })
    
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
                            "profit": p.profit
                        })

                # NEW: Fetch small history only for the primary chart symbol (Otimização)
                symbol_for_history = "XAUUSD" # Default ou pegue do estado
                tf = mt5.TIMEFRAME_M2
                history_data = []
                rates = mt5.copy_rates_from_pos(symbol_for_history, tf, 0, 100)
                if rates is not None:
                    for r in rates:
                        history_data.append({
                            "time": int(r[0]), "open": float(r[1]), "high": float(r[2]),
                            "low": float(r[3]), "close": float(r[4])
                        })

                send_json({
                    "type": "status", 
                    "balance": acc.balance, 
                    "equity": acc.equity,
                    "profit": round(acc.profit, 2),
                    "name": acc.name,
                    "server": acc.server,
                    "positions": pos_list,
                    "history": history_data,
                    "calendar": [] # Pode ser adicionado se necessário
                })
            time.sleep(2) # Intervalo um pouco maior para não sobrecarregar sync
    except KeyboardInterrupt:
        pass
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    main()
