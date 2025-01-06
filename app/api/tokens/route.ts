import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://tokens.jup.ag/tokens?tags=verified');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}