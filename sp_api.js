'use strict';
const request = require('sync-request');
const fs = require("fs");

// ========== data {{{
const SERVER = "www.speedrun.com";
const URL = `http://${SERVER}`;
const cache_path = './cache.json';
const headers = { //{{{
  'User-Agent': 'twitch-wr-bot(Nacalyator)/0.0.1',
  'content-type': 'application/json'
}; //}}}
const options = { //{{{
  headers: headers,
  followRedirects: true,
  maxRedirects: 20,
  gzip: true,
  maxRetr: 10
}; //}}}
//}}}

// ========== API

// ===== GET

function getGameList() { //{{{
//Note: Work properly!
  var gameList = [[], []];
  var paginator = 0;
  var onPage = 1000;
  if (!fs.existsSync(cache_path)) {
    fs.writeFileSync(cache_path);
  }
  for (var i = 0; i <=  12; i++) {
    paginator = onPage * i; 
    var res = request('GET', `${URL}/api/v1/games?_bulk=yes&max=${onPage}&offset=${paginator}`);
    var json = JSON.parse(res.getBody('utf8'));
    var data = json.data;
    var dataLength = data.length;
    for (var j = 0; j < dataLength; j++) {
      gameList[1].push(data[j].id);
      if (data[j].names.hasOwnProperty('twitch')) {
        gameList[0].push(data[j].names.twitch);
      } else {
        gameList[0].push(data[j].names.international);
      }
    }
  }
  gameList = JSON.stringify(gameList, null, '\t');
  fs.writeFileSync(cache_path, gameList);
  return '[Msg] Cache file created!';
}//}}}

function getPlatformList() { //{{{
  var platformList = [[], []];
  var res = request('GET', `${URL}/api/v1/platforms`);
  var json = JSON.parse(res.getBody('utf8'));
  var data = json.data;
  var dataLength = data.length;
  for (var i = 0; i < dataLength; i++) {
    platformList[0].push(data[i].name);
    platformList[0].push(data[i].id);
    console.log(data[i]);
  }
  return platformList;
} //}}}

function getGameID(gameName, gameList) { //{{{
//Note: work properly!
  // Check for arguments length
  if (arguments.length == 0) {
    return '[Err] Needed name of game!';
  } else if (typeof gameName == 'string') {
    if (!gameList || Array.isArray(gameList) ==false) {
      var gameList = loadGameList();
    }
    var index = gameList[0].indexOf(gameName);
    if (index != -1) {
      return gameList[1][index];
    } else {
      return '[Err] Game not found!';
    }
  }
} //}}}

function getGameCategories(gameID) { //{{{
// Note: work properly!
  if (!gameID && typeof gameID != 'string') {
    return '[Err] Needed gameID!';
  }
  var categories = [];
  var res = request('GET', `${URL}/api/v1/games/${gameID}/categories`);
  var json = JSON.parse(res.getBody('utf8'));
  var data = json.data;
  var catLength = data.length;
  for (var i = 0; i < catLength; i++) {
    var category = {
      name: data[i].name,
      ID: data[i].id
    };
    categories.push(category);
  }
  return categories;
}//}}}

function getGameLeaderboard(gameID, categories) { //{{{
  var leaderboards = [];
  // Check for arguments length
  if (arguments.length == 0) {
    return '[Err] Needed ID of the game!';
  } else if (arguments.length == 1 && typeof gameID == 'string') {
    return getGameLeaderboard(gameID, getGameCategories(gameID));
  } else if (arguments.length == 2 && typeof gameID == 'string' && Array.isArray(categories) == true) {
    var catLength = categories.length;
    for (var i = 0; i < catLength; i++) {
      var res = request('GET', `${URL}/api/v1/leaderboards/${gameID}/category/${categories[i].ID}?_top=1`);
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      var record = { //{{{
        gameID: data.runs[0].run.game,
        platformID: data.runs[0].run.system.platform,
        categoryID: data.runs[0].run.category,
        runID: data.runs[0].run.id,
        userID: data.runs[0].run.players[0].id,
        time_s: data.runs[0].run.times.realtime_t,
        time_t:  data.runs[0].run.times.realtime
      }; //}}}
    leaderboards.push(record);
    }
  } else {
  return '[Err] Impossible to get game categories!';
  }
  return leaderboards;
}//}}}

// ===== Load

function loadGameList() { //{{{
  if (!fs.existsSync(cache_path)) {
    getGameList();
  }
  return JSON.parse(fs.readFileSync(cache_path));
} //}}}

// ===== Convert IDs

function platformID2name (platformID, platformList) { //{{{
  if (arguments.length == 1 && typeof arguments[0] == 'string') {
    var res = request('GET', `${URL}/api/v1/platforms/${platformID}`);
    var json = JSON.parse(res.getBody('utf8'));
    return json.data.name;
  } else if (arguments.length == 2 && typeof arguments[0] == 'string' && Array.isArray(arguments[1]) == true) {
    var index = platformList[1].indexOf(platformID);
    if (index != -1) {
      return platformList[0][index];
    } else {
      return '[Err] Platform not found!';
    }
  } else {
    return '[Err] No platformID!'
  }
} //}}}

function userID2name(userID) { //{{{
  if (arguments.length == 0) {
    return '[Err] Needed playerID!';
  } else if (userID && typeof userID == 'string') {
    var res = request('GET', `${URL}/api/v1/users/${userID}`);
    var json = JSON.parse(res.getBody('utf8'));
    var data = json.data;
    var user = {
      ID: data.id,
      name: data.names.international
    }
    if (data.twitch.uri) user.twitch = data.twitch.uri.match(/[^/]*$/gm)[0];
    if (data.twitter.uri) user.twitter = data.twitter.uri.match(/[^/]*$/gm)[0];
    if (data.youtube.uri) user.youtube = data.youtube.uri.match(/[^/]*$/gm)[0];
    return user;
  }
} //}}}

function getWR(gameName) {
  
}

// ========== tests



//var gameID = 'lde2m5d3';

var gameName = 'Titanfall'
getWR(gameName);
