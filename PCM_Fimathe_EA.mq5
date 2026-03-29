//+------------------------------------------------------------------+
//|                                              PCM_Fimathe_EA.mq5 |
//|                                  Copyright 2024, ADKBOT Quantum |
//|                                             https://adkbot.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, ADKBOT Quantum"
#property link      "https://adkbot.com"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

//--- INPUT PARAMETERS
input group "Configuração de Tempo"
input int      InpOpeningHour   = 9;      // Hora de Início (Servidor)
input int      InpOpeningMin    = 0;      // Minuto de Início
input ENUM_TIMEFRAMES InpTimeframe = PERIOD_M2; // Timeframe (M2 obrigatório)

input group "Parâmetros Fimathe"
input int      InpMinChannel    = 200;    // Canal Mínimo (Pontos)
input int      InpMaxChannel    = 3500;   // Canal Máximo (Pontos)
input int      InpSliceChannel  = 1000;   // Gatilho p/ Fatiamento (Pontos)
input double   InpBodyStrength  = 0.6;    // Força do Corpo (60%)

input group "Gestão de Risco"
input double   InpLot           = 0.10;   // Lote Fixo
input double   InpDailyLossLimit= 3.0;    // Limite Perda Diária (%)
input int      InpMaxTradesDay  = 2;      // Máximo Trades por Dia
input bool     InpUseBreakEven  = true;   // Usar Break Even (50% TP)

//--- GLOBAL VARIABLES
CTrade         ExtTrade;
double         G_CanalHigh      = 0;
double         G_CanalLow       = 0;
double         G_CanalSize      = 0;
bool           G_IsBoxDefined   = false;
bool           G_IsBroken       = false;
bool           G_IsWaitingRetest= false;
int            G_Direction      = 0; // 1=Alta, -1=Baixa
int            G_TradesToday    = 0;
double         G_DailyStartEquity = 0;
datetime       G_LastResetDate  = 0;

//--- LOGIC STATE
enum E_STATE { SETUP, WAITING_BREAKOUT, WAITING_RETEST, IN_TRADE };
E_STATE G_CurrentState = SETUP;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   G_DailyStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   G_LastResetDate = iTime(_Symbol, PERIOD_D1, 0);
   Print("PCM Fimathe EA Iniciado. Saldo Inicial do Dia: ", G_DailyStartEquity);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   ObjectsDeleteAll(0, "PCM_");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   CheckDailyLimits();
   
   if(G_CurrentState == SETUP)
      ManageSetup();
   else if(G_CurrentState == WAITING_BREAKOUT)
      ManageBreakout();
   else if(G_CurrentState == WAITING_RETEST)
      ManageRetest();
   else if(G_CurrentState == IN_TRADE)
      ManageInTrade();
}

//+------------------------------------------------------------------+
//| Check Daily Limits                                               |
//+------------------------------------------------------------------+
void CheckDailyLimits()
{
   datetime today = iTime(_Symbol, PERIOD_D1, 0);
   if(today != G_LastResetDate)
   {
      G_LastResetDate = today;
      G_DailyStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      G_TradesToday = 0;
      G_CurrentState = SETUP;
      G_IsBoxDefined = false;
      Print("Ciclo diário resetado.");
   }

   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double lossPercent = ((G_DailyStartEquity - currentEquity) / G_DailyStartEquity) * 100.0;
   
   if(lossPercent >= InpDailyLossLimit || G_TradesToday >= InpMaxTradesDay)
   {
      // Stop for the day
      return;
   }
}

//+------------------------------------------------------------------+
//| Manage Setup (Box Capture)                                       |
//+------------------------------------------------------------------+
void ManageSetup()
{
   MqlDateTime dt;
   TimeCurrent(dt);
   
   // Check if we are at or after the opening time
   if(dt.hour == InpOpeningHour && dt.min >= InpOpeningMin)
   {
      CaptureRefBox(1); // Capture last 4 completed M2 candles
   }
}

//+------------------------------------------------------------------+
//| Capture Reference Box (4 candles of M2)                          |
//+------------------------------------------------------------------+
void CaptureRefBox(int startIdx)
{
   double high[], low[];
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   
   if(CopyHigh(_Symbol, PERIOD_M2, startIdx, 4, high) < 4 || CopyLow(_Symbol, PERIOD_M2, startIdx, 4, low) < 4) return;
   
   double maxH = high[0];
   double minL = low[0];
   
   for(int i=1; i<4; i++)
   {
      if(high[i] > maxH) maxH = high[i];
      if(low[i] < minL)  minL = low[i];
   }
   
   double size = maxH - minL;
   double points = size / _Point;
   
   if(points < InpMinChannel || points > InpMaxChannel)
   {
      // Print("Box ignorada por volatilidade: ", points, " pontos.");
      return;
   }
   
   if(points > InpSliceChannel)
   {
      size /= 2.0;
      maxH = minL + size;
      Print("Canal grande (", points, " pts). Fatiado pela metade.");
   }
   
   G_CanalHigh = maxH;
   G_CanalLow = minL;
   G_CanalSize = size;
   G_IsBoxDefined = true;
   G_CurrentState = WAITING_BREAKOUT;
   
   Print("Box PCM Definida: High=", G_CanalHigh, " Low=", G_CanalLow, " Size=", G_CanalSize / _Point, "pts");
   DrawBox();
}

//+------------------------------------------------------------------+
//| Manage Breakout                                                  |
//+------------------------------------------------------------------+
void ManageBreakout()
{
   // Check last closed candle (Index 1)
   double close = iClose(_Symbol, PERIOD_M2, 1);
   double open  = iOpen(_Symbol, PERIOD_M2, 1);
   double high  = iHigh(_Symbol, PERIOD_M2, 1);
   double low   = iLow(_Symbol, PERIOD_M2, 1);
   
   double body = MathAbs(close - open);
   double range = high - low;
   
   if(range == 0) return;
   
   bool isStrong = (body / range) >= InpBodyStrength;
   if(!isStrong) return;
   
   if(close > G_CanalHigh)
   {
      G_Direction = 1;
      G_IsBroken = true;
      G_CurrentState = WAITING_RETEST;
      Print("Rompimento de ALTA detectado. Aguardando reteste...");
   }
   else if(close < G_CanalLow)
   {
      G_Direction = -1;
      G_IsBroken = true;
      G_CurrentState = WAITING_RETEST;
      Print("Rompimento de BAIXA detectado. Aguardando reteste...");
   }
}

//+------------------------------------------------------------------+
//| Manage Retest (Pullback)                                         |
//+------------------------------------------------------------------+
void ManageRetest()
{
   double lastLow = iLow(_Symbol, PERIOD_M2, 0); // Current Low
   double lastHigh = iHigh(_Symbol, PERIOD_M2, 0); // Current High
   
   bool confirmed = false;
   if(G_Direction == 1 && lastLow <= G_CanalHigh) confirmed = true;
   else if(G_Direction == -1 && lastHigh >= G_CanalLow) confirmed = true;
   
   if(confirmed)
   {
      ExecuteOrder();
   }
}

//+------------------------------------------------------------------+
//| Execute Order                                                    |
//+------------------------------------------------------------------+
void ExecuteOrder()
{
   double price = (G_Direction == 1) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = (G_Direction == 1) ? (G_CanalLow - G_CanalSize) : (G_CanalHigh + G_CanalSize); // 2 levels away
   double tp = (G_Direction == 1) ? (price + G_CanalSize) : (price - G_CanalSize); // 100% projection
   
   // Normalize
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, digits);
   tp = NormalizeDouble(tp, digits);
   
   if(G_Direction == 1)
      ExtTrade.Buy(InpLot, _Symbol, price, sl, tp, "PCM Fimathe Buy");
   else
      ExtTrade.Sell(InpLot, _Symbol, price, sl, tp, "PCM Fimathe Sell");
      
   G_TradesToday++;
   G_CurrentState = IN_TRADE;
   Print("Ordem Executada. Direção: ", (G_Direction==1?"COMPRA":"VENDA"), " SL: ", sl, " TP: ", tp);
}

//+------------------------------------------------------------------+
//| Manage In Trade (Break Even & Restart Cycle)                     |
//+------------------------------------------------------------------+
void ManageInTrade()
{
   if(PositionsTotal() == 0)
   {
      // Trade closed, restart cycle behavior
      Print("Operação encerrada. Iniciando novo ciclo.");
      G_CurrentState = SETUP; 
      G_IsBoxDefined = false;
      return;
   }
   
   if(InpUseBreakEven)
   {
      for(int i=0; i<PositionsTotal(); i++)
      {
         ulong ticket = PositionGetTicket(i);
         if(PositionSelectByTicket(ticket))
         {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol)
            {
               double priceOpen = PositionGetDouble(POSITION_PRICE_OPEN);
               double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
               double tp = PositionGetDouble(POSITION_TP);
               double sl = PositionGetDouble(POSITION_SL);
               
               double totalPath = MathAbs(tp - priceOpen);
               double currentPath = MathAbs(currentPrice - priceOpen);
               
               if(currentPath >= totalPath * 0.5)
               {
                  if((PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY && sl < priceOpen) ||
                     (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL && sl > priceOpen))
                  {
                     ExtTrade.PositionModify(ticket, priceOpen, tp);
                     Print("Break Even ativado para a posição.");
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Draw Box for Visuals                                             |
//+------------------------------------------------------------------+
void DrawBox()
{
   ObjectDelete(0, "PCM_Box");
   ObjectCreate(0, "PCM_Box", OBJ_RECTANGLE, 0, iTime(_Symbol, PERIOD_M2, 4), G_CanalHigh, iTime(_Symbol, PERIOD_M2, 1), G_CanalLow);
   ObjectSetInteger(0, "PCM_Box", OBJPROP_COLOR, clrOrange);
   ObjectSetInteger(0, "PCM_Box", OBJPROP_WIDTH, 2);
}
