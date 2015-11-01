var MeCab = new require('mecab-async'), mecab = new MeCab();
var twitter = require('twitter');   // twitterモジュールを読み込み
var fs = require('fs');
var mysql = require('mysql');
var moment = require("moment");

var twitterInfo = JSON.parse(fs.readFileSync('./config/twitter.json', 'utf8'));
var mysqlInfo = JSON.parse(fs.readFileSync('./config/mysql.json', 'utf8'));
// アプリ登録時に取得したkeyを入れて初期化
var client = new twitter(twitterInfo);

var connection = mysql.createConnection(mysqlInfo);
connection.connect();

// タイムラインから、自分のアカウント名を含む文字列でフィルターする
client.stream('statuses/filter', {track: 'mbs'}, function(stream) {
  stream.on('data', function(tweet) {
    mecab.parse(tweet.text, function(err, result) {
      if (err) throw err;
      var words = result.map(function(cell){
        return cell[0]
      });
      sQuery = "SELECT SUM(`words`.`word`) AS sum_id FROM `words`  WHERE `words`.`id` IN ('" + words.join("','") "'')";
      connection.query(sQuery, function(err, rows, fields) {
        console.log(result);
      });
    });
    var params = {
      tweet: tweet.text,
      twitter_id: tweet.user.id,
      user_name: tweet.user.name,
      tweeted_at: moment(tweet.user.created_at).format('YYYY-MM-DD HH:mm:ss'),
      profile_image_url: tweet.user.profile_image_url,
      profile_background_image_url: tweet.user.profile_background_image_url
    };
    var query = "INSERT INTO `tweets` (";
    var keys = [];
    var values = [];
    Object.keys(params).forEach(function (key) {
      keys.push(key);
      values.push(params[key]);
    });
    query += keys.join(",");
    query += ") VALUES ('";
    query += values.join("','");
    query += "')";

    connection.query(query, function(err, rows, fields) {
      if (err) throw err;
      console.log('The solution is: ', rows);
    });

    console.log(tweet);
  });
 
  stream.on('error', function(error) {
    throw error;
  });
});