require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function getProfile() {
  // Bearer Token を使わず、OAuth 1.0a で認証
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  try {
    // v1.1 API で認証確認（より権限が緩い）
    const me = await client.v1.verifyCredentials();

    console.log('=== プロフィール情報 ===\n');
    console.log(`名前: ${me.name}`);
    console.log(`ユーザー名: @${me.screen_name}`);
    console.log(`自己紹介: ${me.description || '(なし)'}`);
    console.log(`場所: ${me.location || '(なし)'}`);
    console.log(`URL: ${me.url || '(なし)'}`);
    console.log(`\n=== 統計 ===\n`);
    console.log(`フォロワー: ${me.followers_count}`);
    console.log(`フォロー中: ${me.friends_count}`);
    console.log(`ツイート数: ${me.statuses_count}`);
    console.log(`アカウント作成: ${me.created_at}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }

    // v1 が使えない場合は v2 を試す
    console.log('\nv2 API で再試行...\n');
    try {
      const me = await client.v2.me();
      console.log('=== プロフィール情報 (v2) ===\n');
      console.log(`名前: ${me.data.name}`);
      console.log(`ユーザー名: @${me.data.username}`);
    } catch (e2) {
      console.error('v2 も失敗:', e2.message);
    }
  }
}

getProfile();
