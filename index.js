var express = require('express');
var app = express();

var MeCab = new require('mecab-async');
var mecab = new MeCab();

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

//サーバーの立ち上げ
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3001;

app.get('/', function(req, res){
  //res.send('<h1>Hello world</h1>');
  res.sendFile(__dirname + '/index.html');
});

// タイムラインから、自分のアカウント名を含む文字列でフィルターする
client.stream('statuses/filter', {track: '#battle7,#MA11,#mbshack'}, function(stream) {
  stream.on('data', function(tweet) {
    mecab.parse(tweet.text, function(err, result) {
      if (err) throw err;
      console.log(result);
    });
    var params = {
      tweet: tweet.text,
      twitter_id: tweet.user.id,
      user_name: tweet.user.name,
      tweeted_at: moment(tweet.user.created_at).format('YYYY-MM-DD HH:mm:ss'),
      profile_image_url: tweet.user.profile_image_url,
      profile_background_image_url: tweet.user.profile_background_image_url,
      score: 10,
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

    io.emit('tweetInfo', params);
    console.log(tweet);
  });
 
  stream.on('error', function(error) {
    throw error;
  });
});

//サーバーと接続されると呼ばれる
io.on('connection', function(socket){
  console.log('a user connected');
  //接続している、人達(socket)がサーバーにメッセーッジを送った時にcallbackされるイベントを登録
  //第一引数はイベント名
  socket.on('message', function(msg){
    //受け取った人以外でつながっている人全員に送る場合(broadcastを使う)
    //socket.broadcast.emit('message', 'hello');
    //受け取った人含めて全員に送る場合
    //位第一引数のイベント名に対して送る
    io.emit('message', msg);
    console.log('message: ' + msg);
  });

  //サーバーとの接続が遮断されると呼ばれる
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

//指定したポートにきたリクエストを受け取れるようにする
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});