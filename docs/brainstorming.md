# Flow

Start Bot -> Bot Confidence A+ Level -> Request Validasi AI -> AI approve the signal -> Bot receive approval -> Set Entry, SL, TP 1, TP 2, TP 3 and TL -> Store result

# Preparation Data Request Validation

1. Fokus utama saat ini hanya di short-term aja dulu, karna fokus pada futures
2. Kirim semua data candles setiap timeframe
   - TF 1m = 20 candle
   - TF 15m = 50 candle
   - TF 1H = 50 candle
3. RSI14 dan ATR14
   - RSI14 itu adalah `seberapa kuat kenaikan vs penurunan dalam 14 candle terakhir`
   - RSI14 itu buat filter entry sama validasi momentum, contoh
     if (rsi > 70) → overbought (hindari long)
     if (rsi < 30) → oversold (hindari short)

     ideal long: rsi 50–70
     ideal short: rsi 30–50

   - ATR14 itu adalah `ATR = rata-rata “jarak gerak candle”`
   - ATR14 itu buat nentuin SL sama TP
   - ATR14 contoh penggunaanya kayak gini `SL = entry - (ATR * 1.0)`

4. HTF
   if (ema20 > ema50 && ema50 > ema200)
   → bullish

   if (ema20 < ema50 && ema50 < ema200)
   → bearish

5. Liquidity Sweep HTF
   Konsep simpel:

👉 harga “nyentuh / ngelewatin” level penting
👉 lalu balik arah cepat 6. adwadwadawd
