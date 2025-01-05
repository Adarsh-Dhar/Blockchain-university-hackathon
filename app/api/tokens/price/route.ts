import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request : NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids') || 'So11111111111111111111111111111111111111112'; // Default ID if none provided

  try {
    const response = await axios.get(`https://api.jup.ag/price/v2?ids=${ids}&showExtraInfo=true`);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
  }
}