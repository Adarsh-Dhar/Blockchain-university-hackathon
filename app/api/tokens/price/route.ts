import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request : NextRequest) {
  try {
    const requestBody = await request.json();
    const tokenAddress: string = requestBody.tokenAddress;
    const timeStamp: string = requestBody.timeStamp;

    const timestampString = new Date(parseInt(timeStamp)).toISOString();

    const queryParams = new URLSearchParams({
        address: tokenAddress,
        address_type: "token",
        type: "1m",
        time_from: timestampString,
        time_to: timestampString,
      });

    const url = `https://public-api.birdeye.so/defi/history_price?${queryParams.toString()}`;
    const birdeyeApiKey = 'your_birdeye_api_key';
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    let response = await axios.get(url, {
        headers: {
        "X-API-KEY": birdeyeApiKey,
        "x-chain": "solana",
        },
        signal: abortSignal,
    });

    if (response.status === 429) {
        const waitTimeMs = 60 * 1000;
        console.log(`Birdeye rate limit exceeded. Waiting ${waitTimeMs / 1000}s before retrying.`);
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, waitTimeMs);
            abortSignal?.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                reject(new Error("Aborted"));
            });
        });
        response = await axios.get(url, {
            headers: {
            "X-API-KEY": birdeyeApiKey,
            "x-chain": "solana",
            },
            signal: abortSignal,
        });
    }

    if (!(response.status === 200)) {
        throw new Error(`Failed to fetch token price for ${tokenAddress} at rounded timestamp ${timestampString} (requested timestamp: ${timestampString}). Response status: ${response.statusText}`);
    }

    const birdeyeHistoryPriceResponse = response.data;

    if (!birdeyeHistoryPriceResponse.success || birdeyeHistoryPriceResponse.data.items.length === 0) {
        throw new Error(`Failed to fetch token price for ${tokenAddress} at rounded timestamp ${timestampString} (requested timestamp: ${timestampString}). Response: ${JSON.stringify(birdeyeHistoryPriceResponse)}`);
    }

    return NextResponse.json(birdeyeHistoryPriceResponse.data.items[0].value);
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
  }
}