const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const TWEETS_MD_FILE = path.join(__dirname, 'tweets.md');

function parseTweetsFromMarkdown(content) {
  const lines = content.split('\n');
  const tweets = [];
  let currentTweet = [];
  let isInTweet = false;
  let isPosted = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      if (isInTweet && currentTweet.length > 0) {
        const tweetContent = currentTweet.join('\n').trim();
        if (tweetContent && !isPosted) {
          tweets.push({ content: tweetContent, lineStart: tweets.length });
        }
      }
      currentTweet = [];
      isInTweet = true;
      isPosted = false;
    } else if (isInTweet) {
      if (line.includes('[POSTED]')) {
        isPosted = true;
      }
      currentTweet.push(line);
    }
  }

  if (isInTweet && currentTweet.length > 0) {
    const tweetContent = currentTweet.join('\n').trim();
    if (tweetContent && !isPosted) {
      tweets.push({ content: tweetContent, lineStart: tweets.length });
    }
  }

  return tweets;
}

function markTweetAsPosted(content, tweetContent) {
  const marker = `[POSTED ${new Date().toISOString().split('T')[0]}]`;
  const escapedContent = tweetContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(---\\s*\\n)(${escapedContent.split('\n')[0]})`);
  return content.replace(regex, `$1${marker}\n$2`);
}

async function postTweet() {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  if (!fs.existsSync(TWEETS_MD_FILE)) {
    console.log('tweets.md not found');
    return;
  }

  const content = fs.readFileSync(TWEETS_MD_FILE, 'utf8');
  const tweets = parseTweetsFromMarkdown(content);

  if (tweets.length === 0) {
    console.log('No unposted tweets available. Add more tweets to tweets.md');
    return;
  }

  const tweet = tweets[0];

  try {
    const response = await client.v2.tweet(tweet.content);
    console.log(`Tweet posted successfully! ID: ${response.data.id}`);
    console.log(`Content: ${tweet.content.substring(0, 50)}...`);

    const updatedContent = markTweetAsPosted(content, tweet.content);
    fs.writeFileSync(TWEETS_MD_FILE, updatedContent);
    console.log('tweets.md updated with [POSTED] marker');
  } catch (error) {
    console.error('Failed to post tweet:', error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

postTweet();
