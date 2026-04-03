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

     ## Cara Hitung RSI

     Rumus :

     ```plaintext
        1. Hitung perubahan harga (delta)
        Dari close:
        delta = close[i] - close[i-1]

        2. Pisahin gain & loss
        gain = kalau delta > 0 → delta, else 0
        loss = kalau delta < 0 → abs(delta), else 0

        3. Hitung average awal (14 candle pertama)
        avgGain = sum(gain 14 candle) / 14
        avgLoss = sum(loss 14 candle) / 14

        4. Candle berikutnya pakai smoothing
        avgGain = ((prevAvgGain * 13) + currentGain) / 14
        avgLoss = ((prevAvgLoss * 13) + currentLoss) / 14

        5. Hitung RS
        RS = avgGain / avgLoss

        6. Hitung RSI
        RSI = 100 - (100 / (1 + RS))
     ```

     Contoh :

     ```plaintext
        Close terakhir 14 candle kira-kira kayak gini:
        68200
        68250
        68300
        68280
        68350
        68400
        68370
        68420
        68480
        68450
        68500
        68530
        68510
        68580

        Kita hitung perubahan tiap candle:
        +50
        +50
        -20
        +70
        +50
        -30
        +50
        +60
        -30
        +50
        +30
        -20
        +70

        Pisahin gain & loss
        Gain total ≈ 480
        Loss total ≈ 100

        Average:
        avgGain = 480 / 14 ≈ 34.3
        avgLoss = 100 / 14 ≈ 7.1

        Hitung RSI:
        RS = 34.3 / 7.1 ≈ 4.8
        RSI = 100 - (100 / (1 + 4.8))
        RSI ≈ 82
     ```

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
👉 lalu balik arah cepat

6. adwadwadawd
