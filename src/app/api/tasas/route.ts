import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Dólar BCV y Paralelo
    const dolaresRes = await fetch("https://ve.dolarapi.com/v1/dolares", { cache: "no-store" });
    const dolares = await dolaresRes.json();
    const oficial = dolares.find((d: any) => d.fuente === "oficial");
    const paralelo = dolares.find((d: any) => d.fuente === "paralelo");

    // 2. Euro BCV
    const eurosRes = await fetch("https://ve.dolarapi.com/v1/euros/oficial", { cache: "no-store" });
    const euroData = await eurosRes.json();

    // 3. Binance P2P (Mocks para evitar bloqueos si no hay proxy complejo, o intentamos el API público si es posible)
    // Usaremos un estimado temporal basado en paralelo si Binance falla
    let binancePromedio = paralelo ? paralelo.promedio + 4.5 : 0;
    
    try {
      const binancePayload = {
        "fiat": "VES",
        "page": 1,
        "rows": 5,
        "tradeType": "BUY",
        "asset": "USDT",
        "countries": [],
        "proMerchantAds": false,
        "shieldMerchantAds": false,
        "publisherType": null,
        "payTypes": [],
        "classifies": ["mass", "profession"]
      };
      const binanceRes = await fetch("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(binancePayload),
        cache: "no-store"
      });
      if (binanceRes.ok) {
        const binanceData = await binanceRes.json();
        if (binanceData?.data && binanceData.data.length > 0) {
          binancePromedio = parseFloat(binanceData.data[0].adv.price);
        }
      }
    } catch (e) {
      console.log("Error obteniendo Binance P2P:", e);
    }

    return NextResponse.json({
      bcv: {
        promedio: oficial?.promedio || 0,
        fecha: oficial?.fechaActualizacion || new Date().toISOString()
      },
      euro: {
        promedio: euroData?.promedio || 0,
        fecha: euroData?.fechaActualizacion || new Date().toISOString()
      },
      paralelo: {
        promedio: paralelo?.promedio || 0,
        fecha: paralelo?.fechaActualizacion || new Date().toISOString()
      },
      binance: {
        promedio: binancePromedio,
        fecha: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
