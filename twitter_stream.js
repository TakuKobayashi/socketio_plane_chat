var twitter = require('twitter');   // twitterモジュールを読み込み

// アプリ登録時に取得したkeyを入れて初期化
var client = new twitter(require('./config/twitter.json'););

// タイムラインから、自分のアカウント名を含む文字列でフィルターする
client.stream('statuses/filter', {track: 'mbs'}, function(stream) {
  stream.on('data', function(tweet) {
    console.log(tweet);
  });
 
  stream.on('error', function(error) {
    throw error;
  });
});