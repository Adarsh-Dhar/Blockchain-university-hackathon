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

interface EnhancedTweet extends TwitterTweet {
  author: TwitterUser & {
    follower_count: number;
  };
  relevanceScore: number;
}

// Corrected spam detection patterns with proper JavaScript regex syntax
const SPAM_PATTERNS = [
  /giveaway.*follow/i,
  /airdrop/i,
  /winner.*dm/i,
  /scam/i,
  /bot/i,
  /telegram.*join/i,
  /\b(dm|pm)\s+(?:me|now)\b/i,
  /(?:free|win).*(?:nft|token)/i,
  /click.*(?:link|bio)/i,
  /send.*wallet/i,
  /\d+x(?:\s+|\s*money|\s*gains)/i,  // Matches promises of multiplication of gains
  /100%.*guaranteed/i,
  /\b(?:hurry|rush)\b.*\b(?:now|fast)\b/i,
  /next.*(?:moon|gem|1000x)/i
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

  // Skip if basic criteria aren't met
  if (!author || !public_metrics) return 0;

  // Account quality score (0-100)
  const accountQualityScore = Math.min(
    100,
    (author.public_metrics.followers_count / 1000) * 20 + // Followers impact
    (author.public_metrics.listed_count * 5) + // Listed count impact
    (author.verified ? 30 : 0) // Verification bonus
  );

  // Engagement score (0-100)
  const engagementScore = Math.min(
    100,
    ((public_metrics.retweet_count * 2 +
      public_metrics.like_count +
      public_metrics.reply_count * 1.5 +
      public_metrics.quote_count * 2) / 100) * 20
  );

  // Content quality score (0-100)
  const contentQualityScore = Math.min(
    100,
    (text.length > 80 ? 30 : 10) + // Favor longer, more detailed tweets
    (!text.includes('http') ? 20 : 0) + // Less weight to link-only tweets
    (text.match(/#/g)?.length || 0 <= 3 ? 20 : 0) // Penalize hashtag spam
  );

  // Calculate final relevance score (0-100)
  const relevanceScore = Math.round(
    (accountQualityScore * 0.4) +
    (engagementScore * 0.4) +
    (contentQualityScore * 0.2)
  );

  return relevanceScore;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const minRelevanceScore = Number(searchParams.get('minRelevanceScore')) || 40; // Default threshold

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword required' }, { status: 400 });
    }

    const url = `https://api.twitter.com/2/tweets/search/recent?query=${keyword}`
      + '&tweet.fields=created_at,text,public_metrics'
      + '&user.fields=public_metrics,created_at,verified'
      + '&expansions=author_id';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Error data:', errorData);
      return NextResponse.json(
        { error: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Combine tweets with user data and add relevance scoring
    const enhancedTweets: EnhancedTweet[] = data.data
      .map((tweet: TwitterTweet) => {
        const author = data.includes.users.find(
          (user: TwitterUser) => user.id === tweet.author_id
        );
        
        return {
          ...tweet,
          author: {
            ...author,
            follower_count: author.public_metrics.followers_count
          }
        } as EnhancedTweet;
      })
      .map((tweet: EnhancedTweet) => ({
        ...tweet,
        relevanceScore: calculateTweetRelevance(tweet)
      }))
      .filter((tweet: EnhancedTweet) => {
        // Filter out spam and low relevance tweets
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