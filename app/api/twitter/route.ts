import { NextResponse } from 'next/server';

// Types for Twitter API response
interface TwitterUser {
  id: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at: string;
  verified: boolean;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterApiResponse {
  data?: TwitterTweet[];
  includes?: {
    users: TwitterUser[];
  };
  meta?: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
    next_token?: string;
  };
}

interface EnhancedTweet extends TwitterTweet {
  author: TwitterUser & {
    follower_count: number;
  };
  relevanceScore: number;
}

const SPAM_PATTERNS = [
  /giveaway.*follow/i,
  /airdrop/i,
  /winner.*dm/i,
  /scam/i,
  /bot/i,
  /telegram.*join/i,
  /\b(dm|pm)\s+(?:me|now)\b/i,
  /(?:free|win).*(?:nft|token)/i,
  /click.*(?:link|bio)/i
];

function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some(pattern => pattern.test(text));
}

function calculateTweetRelevance(tweet: EnhancedTweet): number {
  const {
    author,
    public_metrics,
    text
  } = tweet;

  if (!author || !public_metrics) return 0;

  const accountQualityScore = Math.min(
    100,
    (author.public_metrics.followers_count / 1000) * 20 +
    (author.public_metrics.listed_count * 5) +
    (author.verified ? 30 : 0)
  );

  const engagementScore = Math.min(
    100,
    ((public_metrics.retweet_count * 2 +
      public_metrics.like_count +
      public_metrics.reply_count * 1.5 +
      public_metrics.quote_count * 2) / 100) * 20
  );

  const contentQualityScore = Math.min(
    100,
    (text.length > 80 ? 30 : 10) +
    (!text.includes('http') ? 20 : 0) +
    (text.match(/#/g)?.length || 0 <= 3 ? 20 : 0)
  );

  return Math.round(
    (accountQualityScore * 0.4) +
    (engagementScore * 0.4) +
    (contentQualityScore * 0.2)
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const minRelevanceScore = Number(searchParams.get('minRelevanceScore')) || 40;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword required' }, { status: 400 });
    }

    const url = `https://api.twitter.com/2/tweets/search/recent?query=${keyword}`
  + '&tweet.fields=created_at,text,public_metrics'
  + '&user.fields=public_metrics,created_at,verified'
  + '&expansions=author_id'
  + '&max_results=10'

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer AAAAAAAAAAAAAAAAAAAAACO1vQEAAAAA%2B7S5hRNSxg81aeUmuNIIkEjzM7s%3DKkYajK7Oo9Md5rMA7xhLP2S8U3YJii9Xm7T1KYTvxRzfPhKrHR`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Twitter API Error:', errorData);
      return NextResponse.json(
        { error: 'Twitter API error', details: errorData },
        { status: response.status }
      );
    }

    const data: TwitterApiResponse = await response.json();
    console.log('Twitter API Response:', JSON.stringify(data, null, 2));

    // Check if we have valid data
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid or empty response from Twitter API:', data);
      return NextResponse.json({
        error: 'No tweets found or invalid response',
        data: data
      }, { status: 200 });
    }

    // Check if we have users data
    if (!data.includes?.users) {
      console.error('No users data in response:', data);
      return NextResponse.json({
        error: 'No user data found in response',
        data: data
      }, { status: 200 });
    }

    // Process tweets with proper error checking
    const enhancedTweets: EnhancedTweet[] = data.data
      .filter(tweet => tweet && tweet.author_id) // Ensure tweet has required fields
      .map((tweet: TwitterTweet) => {
        const author = data.includes?.users.find(
          (user: TwitterUser) => user.id === tweet.author_id
        );
        
        if (!author) {
          console.warn(`No author found for tweet ${tweet.id}`);
          return null;
        }

        return {
          ...tweet,
          author: {
            ...author,
            follower_count: author.public_metrics.followers_count
          }
        } as EnhancedTweet;
      })
      .filter((tweet): tweet is EnhancedTweet => tweet !== null)
      .map((tweet: EnhancedTweet) => ({
        ...tweet,
        relevanceScore: calculateTweetRelevance(tweet)
      }))
      .filter((tweet: EnhancedTweet) => {
        return !isSpam(tweet.text) && 
               tweet.relevanceScore >= minRelevanceScore &&
               tweet.author.public_metrics.followers_count >= 50;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      tweets: enhancedTweets,
      metadata: {
        total_tweets: data.data.length,
        filtered_tweets: enhancedTweets.length,
        min_relevance_score: minRelevanceScore
      }
    });
    
  } catch (error) {
    console.error('Caught error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}