const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const TWEETS_MD_FILE = path.join(__dirname, 'tweets.md');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const LOW_TWEET_THRESHOLD = 3;

async function sendSlackNotification(message, isWarning = false) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('SLACK_WEBHOOK_URL not set, skipping notification');
    return;
  }

  const payload = {
    text: isWarning ? `:warning: ${message}` : `:bird: ${message}`,
  };

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Slack notification failed:', response.status);
    }
  } catch (error) {
    console.error('Slack notification error:', error.message);
  }
}

/**
 * tweets.md のフォーマット:
 *
 * ---
 * 単発ツイートの内容
 * ---
 *
 * ===
 * スレッド1つ目の内容
 * +++
 * スレッド2つ目の内容（リプライ）
 * +++
 * スレッド3つ目の内容（リプライ）
 * ===
 *
 * [POSTED 2025-01-15] がある場合は投稿済み
 */
function parseTweetsFromMarkdown(content) {
  const posts = [];

  // スレッド（=== で囲まれた部分）を先に抽出
  const threadRegex = /===\n([\s\S]*?)\n===/g;
  let match;
  let processedContent = content;

  while ((match = threadRegex.exec(content)) !== null) {
    const threadBlock = match[0];
    const threadContent = match[1];

    // [POSTED があればスキップ
    if (threadContent.includes('[POSTED')) {
      continue;
    }

    // +++ で分割してスレッドの各ツイートを取得
    const threadTweets = threadContent
      .split('+++')
      .map(t => t.trim())
      .filter(t => t && !t.includes('[POSTED'));

    if (threadTweets.length > 0) {
      posts.push({
        type: 'thread',
        tweets: threadTweets,
        rawBlock: threadBlock,
        firstLine: threadTweets[0].split('\n')[0]
      });
    }
  }

  // 単発ツイート（--- で囲まれた部分）
  const lines = content.split('\n');
  let currentTweet = [];
  let isInTweet = false;
  let isPosted = false;
  let isInThread = false;

  for (const line of lines) {
    // スレッドブロック内はスキップ
    if (line.trim() === '===') {
      isInThread = !isInThread;
      continue;
    }
    if (isInThread) continue;

    if (line.trim() === '---') {
      if (isInTweet && currentTweet.length > 0) {
        const tweetContent = currentTweet.join('\n').trim();
        if (tweetContent && !isPosted) {
          posts.push({
            type: 'single',
            content: tweetContent,
            firstLine: tweetContent.split('\n')[0]
          });
        }
      }
      currentTweet = [];
      isInTweet = true;
      isPosted = false;
    } else if (isInTweet) {
      if (line.includes('[POSTED')) {
        isPosted = true;
      } else {
        currentTweet.push(line);
      }
    }
  }

  // 最後のブロック
  if (isInTweet && currentTweet.length > 0) {
    const tweetContent = currentTweet.join('\n').trim();
    if (tweetContent && !isPosted) {
      posts.push({
        type: 'single',
        content: tweetContent,
        firstLine: tweetContent.split('\n')[0]
      });
    }
  }

  return posts;
}

function markAsPosted(content, post) {
  const marker = `[POSTED ${new Date().toISOString().split('T')[0]}]`;
  const escapedFirstLine = post.firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (post.type === 'thread') {
    // スレッドの場合: === の直後にマーカーを挿入
    const regex = new RegExp(`(===\\s*\\n)(${escapedFirstLine})`);
    return content.replace(regex, `$1${marker}\n$2`);
  } else {
    // 単発の場合: --- の直後にマーカーを挿入
    const regex = new RegExp(`(---\\s*\\n)(${escapedFirstLine})`);
    return content.replace(regex, `$1${marker}\n$2`);
  }
}

async function postThread(client, tweets) {
  const postedTweets = [];
  let lastTweetId = null;

  for (let i = 0; i < tweets.length; i++) {
    const tweetContent = tweets[i];
    const options = lastTweetId
      ? { reply: { in_reply_to_tweet_id: lastTweetId } }
      : {};

    const response = await client.v2.tweet(tweetContent, options);
    postedTweets.push(response.data);
    lastTweetId = response.data.id;

    console.log(`Thread ${i + 1}/${tweets.length} posted: ${response.data.id}`);
  }

  return postedTweets;
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
  const posts = parseTweetsFromMarkdown(content);

  if (posts.length === 0) {
    console.log('No unposted tweets available. Add more tweets to tweets.md');
    await sendSlackNotification('未投稿のツイートがありません！tweets.md に追加してください。', true);
    return;
  }

  const post = posts[0];
  const remainingAfterPost = posts.length - 1;

  try {
    let preview;

    if (post.type === 'thread') {
      // スレッド投稿
      console.log(`Posting thread with ${post.tweets.length} tweets...`);
      await postThread(client, post.tweets);
      preview = post.tweets[0].substring(0, 30).replace(/\n/g, ' ');
      console.log(`Thread posted successfully! (${post.tweets.length} tweets)`);
    } else {
      // 単発投稿
      const response = await client.v2.tweet(post.content);
      preview = post.content.substring(0, 30).replace(/\n/g, ' ');
      console.log(`Tweet posted successfully! ID: ${response.data.id}`);
    }

    const updatedContent = markAsPosted(content, post);
    fs.writeFileSync(TWEETS_MD_FILE, updatedContent);
    console.log('tweets.md updated with [POSTED] marker');

    // 投稿成功通知 + 残り件数警告
    const typeLabel = post.type === 'thread' ? `スレッド(${post.tweets.length}件)` : 'ツイート';
    if (remainingAfterPost <= LOW_TWEET_THRESHOLD) {
      await sendSlackNotification(
        `${typeLabel}投稿完了: "${preview}..."\n⚠️ 残り${remainingAfterPost}件です！追加してください。`,
        true
      );
    } else {
      await sendSlackNotification(`${typeLabel}投稿完了: "${preview}..." (残り${remainingAfterPost}件)`);
    }
  } catch (error) {
    console.error('Failed to post:', error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    await sendSlackNotification(`投稿失敗: ${error.message}`, true);
    process.exit(1);
  }
}

postTweet();
