import MetaTrader5 as mt5
import sys
import json
import time
import threading

def send_json(data):
    """Auxiliary to send JSON to stdout"""
    print(json.dumps(data), flush=True)

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
                symbol = cmd_data.get("symbol")
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
                    send_json({"type": "error", "message": f"Falha ao copiar rates: {mt5.last_error()}"})
                else:
                    # Convert to list of dicts
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
                    send_json({"type": "history", "symbol": symbol, "data": rates_list})

            elif action == "place_order":
                symbol = cmd_data.get("symbol")
                type_str = cmd_data.get("type")
                lot = cmd_data.get("lot")
                sl = cmd_data.get("sl")
                tp = cmd_data.get("tp")
                
                order_type = mt5.ORDER_TYPE_BUY if type_str == "COMPRA" else mt5.ORDER_TYPE_SELL
                price = mt5.symbol_info_tick(symbol).ask if type_str == "COMPRA" else mt5.symbol_info_tick(symbol).bid
                
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
                    send_json({"type": "trade_success", "deal": result.deal, "order": result.order})

        except Exception as e:
            send_json({"type": "error", "message": str(e)})

def main():
    send_json({"type": "log", "message": "INICIANDO PROTOCOLO DE CONEXÃO MT5..."})
    
    if not mt5.initialize():
        send_json({"type": "error", "message": f"FALHA AO INICIALIZAR MT5: {mt5.last_error()}"})
        sys.exit(1)

    account_info = mt5.account_info()
    if account_info is None:
        send_json({"type": "error", "message": "FALHA AO OBTER INFORMAÇÕES DA CONTA."})
        mt5.shutdown()
        sys.exit(1)

    send_json({
        "type": "connection_success",
        "login": account_info.login,
        "name": account_info.name,
        "server": account_info.server,
        "balance": account_info.balance,
        "equity": account_info.equity,
        "company": account_info.company
    })
    
    # Start command loop in a separate thread
    threading.Thread(target=cmd_loop, daemon=True).start()

    try:
        while True:
            # Update status periodically
            acc = mt5.account_info()
            if acc:
                profit = acc.equity - acc.balance
                send_json({
                    "type": "status", 
                    "balance": acc.balance, 
                    "equity": acc.equity,
                    "profit": round(profit, 2),
                    "name": acc.name,
                    "server": acc.server
                })
            time.sleep(2)
    except KeyboardInterrupt:
        pass
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    main()
