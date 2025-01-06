// app/api/tweets/search/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      )
    }

    const url = `https://api.twitter.com/2/tweets/search/recent?query=${keyword}&tweet.fields=created_at,text`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      console.log('Twitter API response status:', response.status)
      console.log('Twitter API response headers:', Object.fromEntries(response.headers))
      const errorData = await response.text()
      console.log('Twitter API error data:', errorData)
      throw new Error(`Twitter API error: ${response.statusText}`)
    }

    const tweets = await response.json()
    return NextResponse.json(tweets.data)
    
  } catch (error) {
    console.error('Error fetching tweets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweets' },
      { status: 500 }
    )
  }
}