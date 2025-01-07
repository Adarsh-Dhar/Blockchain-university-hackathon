import tweepy
from flask import Flask, request, jsonify
import pandas as pd
import csv

app = Flask(__name__)

api_key = "GSIOoNzaRzMlLULRB2uZCnbxt"
api_key_secret = "vtqI4202sNoUViepoYtTFHYPcEjJneTn8U055irhtkyFyVGaEC"
access_token = "1795898303294615555-k5JbC6uB6LZGB3kOK2lePIcfVmTBFA"
access_token_secret = "TJSZbPpQinwRtToz1bjrQIfIOC4KaTDJtE5TicLnF433C"
bearer_token = "AAAAAAAAAAAAAAAAAAAAAA%2FBxwEAAAAA8xDICtukMjz0HSBFuOmcktO0%2F%2Bs%3DfmOVCkWstLAbLQQGq0q76is3wIbYd8bnVZdr1eWBZLwVQvFTAm"

auth = tweepy.OAuth1UserHandler(api_key, api_key_secret, access_token, access_token_secret)
api_v1 = tweepy.API(auth, wait_on_rate_limit=True)
client_v2 = tweepy.Client(bearer_token=bearer_token)

def get_tweets_v1(query, count=10):
    try:
        tweets = api_v1.search_tweets(q=query, lang="en", count=count, tweet_mode="extended")
        tweet_data = [
            {"user": tweet.user.name, "date_created": tweet.created_at, 
             "likes": tweet.favorite_count, "source": tweet.source, "tweet": tweet.full_text} 
            for tweet in tweets
        ]
        return tweet_data
    except Exception as e:
        return str(e)

def get_tweets_v2(query, count=10):
    try:
        tweets = client_v2.search_recent_tweets(query=query, max_results=count, tweet_fields=["created_at", "author_id", "public_metrics", "text"])
        tweet_data = [
            {"user": tweet.author_id, "date_created": tweet.created_at, 
             "likes": tweet.public_metrics["like_count"], "tweet": tweet.text} 
            for tweet in tweets.data
        ]
        return tweet_data
    except Exception as e:
        return str(e)

def save_to_csv(tweets, filename='tweets.csv'):
    columns = ["user", "date_created", "likes", "source", "tweet"]
    if "source" not in tweets[0]:
        columns = ["user", "date_created", "likes", "tweet"]
    
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(tweets)

@app.route('/search_tweets', methods=['GET'])
def search_tweets():
    query = request.args.get('query', '')
    count = int(request.args.get('count', 10))
    api_version = request.args.get('api_version', 'v1.1')

    if api_version == 'v1.1':
        tweets = get_tweets_v1(query, count)
    elif api_version == 'v2':
        tweets = get_tweets_v2(query, count)
    else:
        return jsonify({"error": "Invalid API version. Choose 'v1.1' or 'v2'."}), 400

    if isinstance(tweets, str):
        return jsonify({"error": tweets}), 400

    save_to_csv(tweets, filename='tweets.csv')

    return jsonify({"message": "Tweets fetched and saved to CSV file."})

if __name__ == '__main__':
    app.run(debug=True)
