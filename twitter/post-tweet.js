const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const TWEETS_FILE = path.join(__dirname, 'tweets.json');

async function postTweet() {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  const data = JSON.parse(fs.readFileSync(TWEETS_FILE, 'utf8'));
  const unpostedTweets = data.tweets.filter(t => !t.posted);

  if (unpostedTweets.length === 0) {
    console.log('No unposted tweets available. Add more tweets to tweets.json');
    return;
  }

  const tweet = unpostedTweets[0];

  try {
    const response = await client.v2.tweet(tweet.content);
    console.log(`Tweet posted successfully! ID: ${response.data.id}`);
    console.log(`Content: ${tweet.content.substring(0, 50)}...`);

    tweet.posted = true;
    tweet.postedAt = new Date().toISOString();
    tweet.tweetId = response.data.id;

    fs.writeFileSync(TWEETS_FILE, JSON.stringify(data, null, 2));
    console.log('tweets.json updated');
  } catch (error) {
    console.error('Failed to post tweet:', error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

postTweet();
