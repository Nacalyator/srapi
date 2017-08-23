'use strict';
const request = require('sync-request');
const fs = require('fs');
const stringSimilarity = require('string-similarity');

// ========== API object

var srapi = module.exports = function() { //{{{
  if (!(this instanceof srapi)) return new srapi();
  // ===== options {{{
  this.options = {
    URL: `https://www.speedrun.com`,
    GLP: 'gamelist.json',
    PLP: 'platformlist.json',
    LP: 'log.log',
    ELP: 'err-log.log',
    _debug: true,
    _simTreshold: 0.45,
    request: { //{{{
      headers: {
        'User-Agent': 'srapi(NodeJS)/0.0.6',
        'content-type': 'application/json'
      },
      followRedirects: true,
      maxRedirects: 20,
      maxRetr: 10
    } //}}}
  };
  //}}}
  // ===== Initializating {{{
  this._gameList = [];
  this._platformList = [];
  this.loadGameList();
  this.loadPlatformList();
  if (this.options._debug === true) {
    this.logger = fs.createWriteStream(this.options.LP, {
      flags: 'a',
      defaultEncoding: 'utf8',
      autoClose: true
    });
    this.errlogger = fs.createWriteStream(this.options.ELP, {
      flags: 'a',
      defaultEncoding: 'utf8',
      autoClose: true
    })
  }; //}}}
} //}}}

// ===== GET methods

srapi.prototype.getGameList = function() { //{{{
  var self = this;
  var paginator = 0;
  var onPage = 1000;
  var indicator = 1;
  var i = 0;
  while (indicator > 0) {
    paginator = onPage * i;
    try {
      var res = request('GET', `${this.options.URL}/api/v1/games?_bulk=yes&max=${onPage}&offset=${paginator}`, this.options.request);
    }
    catch (err) {
      if (this._debug) this._errlogger(err);
    }
    if (res && res.statusCode == 200) {
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      var dataLength = data.length;
      for (var j = 0; j < dataLength; j++) {
        this._gameList.push([data[j].id, data[j].names.international]);
      }
    }
    indicator = dataLength;
    i++;
  }
  fs.writeFileSync(this.options.GLP, JSON.stringify(this._gameList, null, '\t'));
} //}}}

srapi.prototype.getPlatformList = function() { //{{{
  var self = this;
  var paginator = 0;
  var onPage = 20;
  var indicator = 1;
  var i = 0;
  while (indicator > 0) {
    paginator = onPage * i;
    try {
      var res = request('GET', `${this.options.URL}/api/v1/platforms?max=${onPage}&offset=${paginator}`, this.options.request);
    }
    catch (err) {
      if (this._debug) this._errlogger(err);
    }
    if (res && res.statusCode == 200) {
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      var dataLength = data.length;
      for (var j = 0; j < dataLength; j++) {
        this._platformList.push([data[j].id, data[j].name]);
      }
    }
    indicator = dataLength;
    i++;
  }
  fs.writeFileSync(this.options.PLP, JSON.stringify(this._platformList, null, '\t'));
} //}}}

srapi.prototype.getGameID = function(gameName) { //{{{
  var self = this;
  if (arguments.length === 0) {
    return null;
    console.log('[Err] [getGameID] Need arguments!');
  } else if (gameName && (typeof gameName === 'string') && gameName.length > 0) {
    if (this._gameList.lengt === 0) this.loadGameList();
    var index = this._gameList.findIndex((el) => el[1] === gameName);
    if (index != -1) {
      return this._gameList[index][0];
    } else {
      var result = this.searchGameLocaly(gameName, 1);
      if (result && (result.lengt > 0)) {
        return result[0][1];
      } else {
        console.log('[Err] [getGameID] Cannot find game!')
        return null;
      }
    }
  } else {
    console.log('[Err] [getGameID] Wrong argument!')
    return null;
  }
} //}}}

srapi.prototype.getGameCategories = function(gameID) { //{{{
  if (arguments.length === 0) {
    return null;
    console.log('[Err] [getGameCategories] Need arguments!');
  } else if (gameID && (typeof gameID == 'string') && (gameID.length > 0)) {
    var categories = [];
    try {
      var res = request('GET', `${this.options.URL}/api/v1/games/${gameID}/categories`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    if (res && res.statusCode === 200) {
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      var catLength = data.length;
      for (var i = 0; i < catLength; i++) {
        categories.push([data[i].id, data[i].name]);
      }
      return categories;
    } else {
      console.log('[Err] [getGameCategories] Cannot get data from server');
      return null;
    }
  } else {
    console.log('[Err] [getGameCategories] Wrong argument');
    return null;
  }
} //}}}

srapi.prototype.getGameLeaderboard = function(gameID, categories) { //{{{
  var leaderboards = [];
  if (arguments.length === 0) {
    console.log('[Err] [getGameLeaderboard] Need arguments!')
    return null;
  } else if ((arguments.length === 1) && gameID && (typeof gameID === 'string') && (gameID.length > 0)) {
    return this.getGameLeaderboard(gameID, this.getGameCategories(gameID));
  } else if (gameID && categories && (typeof gameID === 'string') && Array.isArray(categories) && (gameID.length > 0) && (categories.length > 0)) {
    var catLength = categories.length;
    for (var i = 0; i < catLength; i++) {
      try {
        var res = request('GET', `${this.options.URL}/api/v1/leaderboards/${gameID}/category/${categories[i][0]}?_top=1`, this.options.request);
      }
      catch (err) {
        this._errlogger(err);
      }
      if (res && res.statusCode === 200) {
        var json = JSON.parse(res.getBody('utf8'));
        var data = json.data;
        if (data.runs[0] !== undefined) {
          var record = {
            gameID: data.game,
            platformID: data.runs[0].run.system.platform,
            categoryID: data.category,
            runID: data.runs[0].run.id,
            userID: data.runs[0].run.players[0].id,
            time_t: data.runs[0].run.times.primary,
            time_s:  data.runs[0].run.times.primary_t
          }
          leaderboards.push(record);
        }
      }
    }
    return leaderboards;
  } else {
    console.log('[Err] [getGameLeaderboard] Wrong arguments');
    return null;
  }
} //}}}

srapi.prototype.getUserPB = function(userID) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [getUserPB] Need argument!');
    return null;
  } else if (userID && (typeof userID === 'string') && (userID.length > 0)) {
    if (this._gameList.length === 0) this.loadGameList();
    if (this._platformList.length === 0) this.loadPlatformList();
    var results = [];
    try {
      var res = request('GET', `${this.options.URL}/api/v1/users/${userID}/personal-bests?top=3`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    if (res && res.statusCode === 200) {
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      var dataLength = data.length;
      if (dataLength === 0) return null;
      for (var i = 0; i < dataLength; i++) {
        if (data[i].run.status.status === 'verified') {
          results.push([
            data[i].place,
            this.gameID2name(data[i].run.game),
            this.platformID2name(data[i].run.system.platform),
            data[i].run.times.primary
          ])
        }
      }
      return results;
    } else {
      console.log('[Err] [getUserPB] Server don\'t responce!');
      return null;
    }
  } else {
    console.log('[Err] [getUserPB] Wrong arguments!');
    return null;
  }
} //}}}

// ===== SEARCH methods

srapi.prototype.searchGame = function(gameToSearch, numOfRs) { //{{{
  if (arguments.length === 0 || typeof gameToSearch !== 'string' || gameToSearch.length < 1) {
    console.log('[Err] [searchGame] Wrong arguments!');
    return null;
  }
  if (!numOfRs) numOfRs = 20;
  var results = [];
  var counter = 0;
  var fixedName = gameToSearch.replace(' ', '%20');
  // Get list of game from server
  // {{{
  try {
    var gamesRes = request('GET', `${this.options.URL}/api/v1/games?_bulk=yes&max=1000&orderby=similarity&name=${fixedName}`, this.options.request);
  }
  catch (err) {
    this._errlogger(err);
  }
  var json = JSON.parse(gamesRes.getBody('utf8'));
  var gameData = json.data;
  if (gameData.length === 0) {
    try {
      gamesRes = request('GET', `${this.options.URL}/api/v1/games?_bulk=yes&max=1000&orderby=similarity&abbreviation=${fixedName}`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    json = JSON.parse(gamesRes.getBody('utf8'));
    gameData = json.data;
  }
  // }}}
  // Get game series list
  // {{{
  try {
    var seriesRes = request('GET', `${this.options.URL}/api/v1/series?_bulk=yes&max=${numOfRs}&name=${fixedName}`, this.options.request);
  }
  catch (err) {
    this._errlogger(err);
  }
  json = JSON.parse(seriesRes.getBody('utf8'));
  var seriesData = json.data;
  if (seriesData.length === 0) {
    try {
      seriesRes = request('GET', `${this.options.URL}/api/v1/series?_bulk=yes&max=${numOfRs}&abbreviation=${fixedName}`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    json = JSON.parse(seriesRes.getBody('utf8'));
    seriesData = json.data;
  }
  // }}}
  // Add data to results of search
  // {{{
  if (gameData.length === 0 && seriesData.length === 0) {
    console.log(`[Msg] [searchGame] ${gameToSearch} not found!`);
    return null;
  }
  // Gamelist
  var gameLength = gameData.length;
  for (var i = 0; i < gameLength && counter < numOfRs; i++) {
    results.push([gameData[i].id, gameData[i].names.international]);
    counter++;
  }
  // Serieslist
  var seriesLength = seriesData.lengt;
  for (var i = 0; i < seriesLength && counter < numOfRs; i++) {
    try {
      var res = request('GET', `${this.options.URL}/api/v1/series/${id}/games?_bulk=yes`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    var json = JSON.parse(res.getBody('utf8'));
    var data = json.data;
    var dataLength = data.lengt;
    for (var j = 0; j < dataLength && counter < numOfRs; j++) {
      results.push([data[j].id, data[j].names.international]);
      counter++;
    }
  }
  // }}}
  return results;
} //}}}

srapi.prototype.searchGameLocaly = function(gameToSearch, numOfRs) { //{{{
  if (arguments.length === 0 || typeof gameToSearch !== 'string' || gameToSearch.length < 1) {
    console.log('[Err] [searchGameLocaly] Wrong arguments!');
    return null;
  }
  if (!numOfRs) numOfRs = 20;
  var results = [];
  var simArray = [];
  var similarity;
  var gamesLength = this._gameList.length;
  for (var i = 0; i < gamesLength; i++) {
    similarity = stringSimilarity.compareTwoStrings(gameToSearch, this._gameList[i][1]);
    if (similarity >= this.options._simTreshold) {
      simArray.push([similarity, i]);
    }
  }
  if (simArray.length === 0) {
    console.log('[Msg] [searchGameLocaly] Nothing found!');
    return null;
  }
  simArray.sort((a, b) => b[0] - a[0]);
  if (simArray.length > numOfRs) simArray = simArray.slice(0, numOfRs);
  var simLength = simArray.length;
  for (var i = 0; i < simLength; i++) {
    results.push(this._gameList[simArray[i][1]]);
  }
  return results;
} //}}}

srapi.prototype.searchUser = function(userToSearch, numOfRs) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [searchUser] Needed arguments!');
    return null;
  } else if (userToSearch && (typeof userToSearch === 'string') && (userToSearch.length > 0)) {
    if (!numOfRs) numOfRs = 20;
    var results = [];
    var fixedName = userToSearch.replace(' ', '%20');
    try {
      var res = request('GET', `${this.options.URL}/api/v1/users?_bulk=yes&max=${numOfRs}&name=${fixedName}`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    if (res && res.statusCode === 200) {
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      if (data.lengt === 0) {
        console.log('[Msg] [searchUser] User not found!');
        return null;
      }
      var resultLength = data.length;
      for (var i = 0; i < resultLength; i++) {
        results.push([data[i].id, data[i].names.international]);
      }
      return results;
    } else {
      console.log('[Err] [searchUser] Server status code is not 200!');
      return null
    }
  } else {
    console.log('[Err] [searchUser] Wrong arguments!');
    return null;
  }
} //}}}

// ===== LOAD methods

srapi.prototype.loadGameList = function() { //{{{
  if (!fs.existsSync(this.options.GLP) || this._gameList.length === 0) {
    this.getGameList();
  } else {
    this._gameList = JSON.parse(fs.readFileSync(this.options.GLP));
  }
} //}}}

srapi.prototype.loadPlatformList = function() { //{{{
  if (!fs.existsSync(this.options.PLP) || this._platformList.length === 0) {
    this.getPlatformList();
  } else {
    this._platformList = JSON.parse(fs.readFileSync(this.options.PLP));
  }
} //}}}

// ===== CONVERT methods

srapi.prototype.userID2name = function(userID) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [userID2name] Needed argument');
    return null;
  } else if (userID && (typeof userID === 'string') && (userID.length > 0)) {
    try {
      var res = request('GET', `${this.options.URL}/api/v1/users/${userID}`, this.options.request);
    }
    catch(err) {
      this._errlogger(err);
    }
    if (res && res.statusCode === 200) {
      var json = JSON.parse(res.getBody('utf8'));
      var data = json.data;
      var user = {};
      user.ID = data.id;
      user.name = data.names.international;
      if (data.twitch !== null) user.twitch = data.twitch.uri.match(/[^/]*$/gm)[0];
      if (data.twitter !== null) user.twitter = data.twitter.uri.match(/[^/]*$/gm)[0];
      if (data.youtube !== null) user.youtube = data.youtube.uri.match(/[^/]*$/gm)[0];
      return user;
    } else {
      console.log('[Err] [userID2name] Server status code is not 200');
      return null;
    }
  } else {
    console.log('[Err] [userID2name] Wrong argument');
    return null;
  }
} //}}}

srapi.prototype.gameID2name = function(gameID) { //{{{
  if (arguments.lengt === 0) {
    console.log('[Err] [getGameID] Need argument!');
    return null;
  } else if (gameID && (typeof gameID === 'string') && (gameID.length > 0)) {
    try {
      var res = request('GET', `${this.options.URL}/api/v1/games/${gameID}`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    if (res && res.statusCode === 200) {
      var json = JSON.parse(res.getBody('utf8'));
      if (json.data) {
        var data = json.data;
        if (data.names.hasOwnProperty('twitch')) {
          return data.names.twitch;
        } else {
          return data.names.international;
        }
      } else {
        console.log('[Err] [gameID2name] Server returns nothing');
        return null;
      }
    } else {
      console.log('[Err] [gameID2name] Server status code is not 200');
      return null;
    }
  } else {
    console.log('[Err] [gameID2name] Wrong argument');
    return null;
  }
} //}}}

srapi.prototype.gameID2nameLocaly = function(gameID) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [gameID2nameLocaly] Nothing to search!');
    return null;
  } else if (gameID && (typeof gameID === 'string') && gameID.length > 0) {
    if (this._gameList.length === 0) this.loadGameList();
    var index = this._gameList.findIndex((el) => el[0] === gameID);
    if (index != -1) {
      return this._gameList[index][1];
    } else {
      return this.gameID2name(gameID);
    }
  } else {
    console.log('[Err] [gameID2nameLocaly] Wrong argument!');
    return null;
  }
} //}}}

srapi.prototype.platformID2name = function(platformID) { //{{{
  if (arguments.lengt === 0) {
    console.log('[Err] [platformID2name] Need argument!');
    return null;
  } else if (platformID && (typeof platformID === 'string') && (platformID.length > 0)) {
    try {
      var res = request('GET', `${this.options.URL}/api/v1/platforms/${platformID}`, this.options.request);
    }
    catch (err) {
      this._errlogger(err);
    }
    if (res && res.statusCode === 200) {
      var json = JSON.parse(res.getBody('utf8'));
      return json.data.name;
    } else {
      console.log('[Err] [platformID2name] Server status code is not 200!');
      return null;
    }
  } else {
    console.log('[Err] [platformID2name] Wrong argument!');
    return null;
  }
} //}}}

srapi.prototype.platformID2nameLocaly = function(platformID) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [platformID2nameLocaly] Need argument!');
    return null;
  } else if (platformID && (typeof platformID === 'string') && (platformID.length > 0)) {
    if (this._platformList.length === 0) this.loadPlatformList();
    var index = this._platformList.findIndex((el) => el[0] === platformID);
    if (index != -1) {
      return this._platformList[index][1];
    } else {
      return this.platformID2name(platformID);
    }
  } else {
    console.log('[Err] [platformID2nameLocaly] Wrong argument!');
    return null;
  }
} //}}}

srapi.prototype.PT2normal = function(time_t) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [PT2normal] Needed argument!')
    return null;
  } else if (time_t && (typeof time_t === 'string') && (time_t.length > 3)) {
    return time_t.substring(2).toLowerCase().replace(/(\D{1})(\d{1})/igm, '$1 $2');
  } else {
    console.log('[Err] [PT2normal] Wrong argument!')
    return null;
  }
} //}}}

// ========== CHAT
// Commands:
// !wr [gamename]
// !su[NumOfR] [username]
// !sg[NumOfR] [gamename]
// !upb [username]

srapi.prototype.parseCMD = function(msg) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [parseCMD] Nothing to parse!');
    return null;
  } else if (msg && (typeof msg === 'string') && (msg.length >= 5)) {
    var CMD, counter, parameter;
    var pattern = /(^\![a-z]+)([0-9]*)(\s)(.+)/igm;
    var buff = pattern.exec(msg);
    if (!buff) {
      return null;
    } else if (buff.length <=3 && buff.length >= 4) {
      return null;
    }
    CMD = buff[1];
    counter = buff[2];
    parameter = buff[4];
    switch(CMD) {
      case '!wr':
        var MSG = this.WR(parameter);
        if (this._debug) this._logger(msg, MSG);
        return MSG;
      case '!su':
        var MSG = this.SU(parameter, counter);
        if (this._debug) this._logger(msg, MSG);
        return MSG;
      case '!sg':
        var MSG = this.SG(parameter, counter);
        if (this._debug) this._logger(msg, MSG);
        return MSG;
      case '!upb':
        var MSG = this.UPB(parameter);
        if (this._debug) this._logger(msg, MSG);
        return MSG;
      case '!goose':
        return this.GOOSE();
      case '!about':
        return this.ABOUT();
      default:
        console.log('[Msg] [parseCMD] Unknown command!');
        return null;
    }
  } else {
    console.log('[Err] [parseCMD] Wrong argument!');
    return null;
  }
} //}}}

srapi.prototype.WR = function(gameName) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [WR] Needed argument!');
    return null;
  } else if (gameName && (typeof gameName === 'string') && (gameName.length > 0)) {
    if (this._gameList.length === 0) this.loadGameList();
    var gameID = this.getGameID(gameName);
    if (!gameID) {
      var buff = this.searchGameLocaly(gameName, 1);
      if (buff) {
        gameName = buff[0][1];
        gameID = buff[0][0];
      } else {
        return null;
      }
    }
    if (!gameID) return null;
    var gameCategories = this.getGameCategories(gameID);
    if (!gameCategories) return null;
    var leaderboards = this.getGameLeaderboard(gameID, gameCategories);
    if (!leaderboards) return null;
    var MSG = `Game: ${gameName}.`;
    var buff = leaderboards.length;
    for (var i = 0; i < buff; i++) {
      var userData = this.userID2name(leaderboards[i].userID);
      if (!gameCategories[i][1]) continue;
      MSG = MSG.concat(` ${gameCategories[i][1]}`);
      if (leaderboards[i].time_t) MSG = MSG.concat(` in ${this.PT2normal(leaderboards[i].time_t)}`);
      MSG = MSG.concat(` by ${userData.name} (${this.platformID2nameLocaly(leaderboards[i].platformID)})`);
      if (i === buff - 1) {
        MSG = MSG.concat('.');
      } else {
        MSG = MSG.concat(' ||');
      }
    }
    return MSG;
  } else {
    console.log('[Err] [WR] Wrong argument!');
    return null;
  }
} //}}}

srapi.prototype.SU = function(userToSearch, counter) { //{{{
  var results = this.searchUser(userToSearch, counter);
  if (!results || results.length === 0) return null;
  var MSG = `Results for search of \'${userToSearch}\':`;
  var resLength = results.length;
  for (var i = 0; i < resLength; i++) {
    MSG = MSG.concat( ` ${results[i][1]}`);
    if (i !== resLength - 1) {
      MSG = MSG.concat(',');
    } else {
      MSG = MSG.concat('.');
    }
  }
  return MSG;
} //}}}

srapi.prototype.SG = function(gameToSearch, numOfRs) { //{{{
  var results = this.searchGameLocaly(gameToSearch, numOfRs);
  if (!results || results.length === 0) return null;
  var MSG = `Results for search of \'${gameToSearch}\':`;
  var resLength = results.length;
  for (var i = 0; i < resLength; i++) {
    MSG = MSG.concat( ` ${results[i][1]}`);
    if (i !== resLength - 1) {
      MSG = MSG.concat(',');
    } else {
      MSG = MSG.concat('.');
    }
  }
  return MSG;
} //}}}

srapi.prototype.UPB = function(userName) { //{{{
  if (arguments.length === 0) {
    console.log('[Err] [UPB] Needed argument!');
    return null;
  }
  var userData = this.searchUser(userName, 1);
  if (userData === null) return null;
  var user = userData[0][1];
  var results = this.getUserPB(user);
  if (results === null) return null;
  var MSG = `PB of ${user}:`;
  var place;
  var resLength = results.length;
  for (var i = 0; i < resLength; i++) {
    switch (results[i][0]) {
      case 1:
        place = results[i][0] + 'st';
        break;
      case 2:
        place = results[i][0] + 'nd';
        break;
      case 3:
        place = results[i][0] + 'rd';
        break;
      default:
        place = results[i][0] + 'th';
        break;
    }
    MSG = MSG.concat(` ${place} place in ${results[i][1]}(${results[i][2]}) with time ${this.PT2normal(results[i][3])}`);
    if (i !== resLength - 1) {
      MSG = MSG.concat(' ||');
    } else {
      MSG = MSG.concat('.');
    }
  }
  return MSG;
} //}}}

srapi.prototype.GOOSE = function() { //{{{
  return `ЗАПУСКАЕМ ░ГУСЯ░▄▀▀▀▄░РАБОТЯГИ░░ ▄███▀░◐░░░▌░░░░░░░ ░░░░▌░░░░░▐░░░░░░░ ░░░░▐░░░░░▐░░░░░░░ ░░░░▌░░░░░▐▄▄░░░░░ ░░░░▌░░░░▄▀▒▒▀▀▀▀▄ ░░░▐░░░░▐▒▒▒▒▒▒▒▒▀▀▄ ░░░▐░░░░▐▄▒▒▒▒▒▒▒▒▒▒▀▄ ░░░░▀▄░░░░▀▄▒▒▒▒▒▒▒▒▒▒▀▄ ░░░░░░▀▄▄▄▄▄█▄▄▄▄▄▄▄▄▄▄▄▀▄ ░░░░░░░░░░░▌▌░▌▌░░░░░ ░░░░░░░░░░░▌▌░▌▌░░░░░ ░░░░░░░░░▄▄▌▌▄▌▌░░░░░`
} //}}}

srapi.prototype.ABOUT = function() { //{{{
  return `Made by Nacalyator`;
} //}}}

// ========= TESTING

srapi.prototype._logger = function(input, MSG) { //{{{
  var currentTime = new Date();
  var date = currentTime.toLocaleString();
  var data = `${date}: ${input}     ${MSG}\n`;
  this.logger.write(data)
} //}}}

srapi.prototype._errlogger = function(err) { //{{{
  var currentTime = new Date();
  var date = currentTime.toLocaleString();
  var msg = `${date}: ${err}\n`;
  this.errlogger.write(msg);
} //}}}
