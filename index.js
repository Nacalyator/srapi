'use strict';
const request = require('sync-request');
const fs = require("fs");

// ========== Exports {{{

module.exports.getGameList = getGameList;
module.exports.getPlatformList = getPlatformList;
module.exports.getGameID = getGameID;
module.exports.getGameCategories = getGameCategories;
module.exports.getGameLeaderboard = getGameLeaderboard;
module.exports.loadGameList = loadGameList;
module.exports.loadPlatformList = loadPlatformList;
module.exports.platformID2name = platformID2name;
module.exports.userID2name = userID2name;
module.exports.WR = WR;

// }}}

// ========== data {{{
const SERVER = "www.speedrun.com";
const URL = `http://${SERVER}`;
const gamelist_path = './gamelist.json';
const platformlist_path = './platformlist.json';
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

function getGameList () { //{{{
//Note: Work properly!
  var gameList = [[], []];
  var paginator = 0;
  var onPage = 1000;
  if (!fs.existsSync(gamelist_path)) {
    fs.writeFileSync(gamelist_path);
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
  fs.writeFileSync(gamelist_path, gameList);
  return gameList;
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
  if (!fs.existsSync(platformlist_path));
  fs.writeFileSync(platformlist_path, JSON.stringify(platformList, null, '\t'));
  return platformList;
} //}}}

function getGameID(gameName, gameList) { //{{{
//Note: work properly!
  // Check for arguments length
  if (arguments.length == 0) {
    return '[Err] Needed name of game!';
  } else if (typeof gameName == 'string') {
    if (!gameList || Array.isArray(gameList) == false) {
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
      if (data.runs[0] != undefined) {
        var record = { //{{{
          gameID: data.game,
          platformID: data.runs[0].run.system.platform,
          categoryID: data.category,
          runID: data.runs[0].run.id,
          userID: data.runs[0].run.players[0].id,
          time_s: data.runs[0].run.times.realtime_t,
          time_t:  (data.runs[0].run.times.realtime != null) ? data.runs[0].run.times.realtime : data.runs[0].run.times.primary
        }; //}}}
      leaderboards.push(record);
      }
    }
  } else {
  return '[Err] Impossible to get game categories!';
  }
  return leaderboards;
}//}}}

// ===== Load

function loadGameList() { //{{{
  if (!fs.existsSync(gamelist_path)) {
    return getGameList();
  } else {
    return JSON.parse(fs.readFileSync(gamelist_path));
  }
} //}}}

function loadPlatformList() { //{{{
  if (!fs.existsSync(platformlist_path)) {
    return getPlatformList();
  } else {
    return JSON.parse(fs.readFileSync(platformlist_path));
  }
} //}}}

// ===== Convert IDs

function platformID2name(platformID, platformList) { //{{{
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

// ===== For twitch

function WR(gameName, gameList) { //{{{
  // load all data
  if (!gameList) var gameList = loadGameList();
  var gameID = getGameID(gameName, gameList);
  var gameCategories = getGameCategories(gameID);
  var leaderboards = getGameLeaderboard(gameID, gameCategories);
  var MSG = `Game: \'${gameName}\'.`;
  var buff = leaderboards.length;
  for (var i = 0; i < buff; i++) {
    var userData = userID2name(leaderboards[i].userID);
    MSG = MSG.concat(` ${gameCategories[i].name} ${leaderboards[i].time_t} (${platformID2name(leaderboards[i].platformID)}) by ${userData.name} (${userData.twitch}) ${i == buff - 1 ? '': '||'}`);
  }
  return MSG;
} //}}}

