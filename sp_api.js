'use strict';
const fetch = require('node-fetch');
const fs = require("fs");
// import fetch from 'node-fetch';
// import fs from 'fs';

// ========== data {{{
const SERVER = "www.speedrun.com";
const URL = `http://${SERVER}`;
const cache_path = './cache.json';
//}}}

// ========== api

// === for speedrun
// It's need to rework! This function must use cycle of promises to get alls
// game names and it's IDs. Problem with cycle realization

function getGameList() { //{{{
//Note: doesn't work!
  var gameList = [[], []];
  var paginator = 0;
  
  if (!fs.existsSync(cache_path)) {
    fs.writeFileSync(cache_path);
  }
  
  for (var i = 0; i <=  12; i++) {
    var paginator = paginator * i; 
    fetch(`${URL}/api/v1/games?_bulk=yes&max=1000&offset=${paginator}`)
      .then((res) => res.json())
      .then((json) => {
        var response = json.data;
        var buff = response.length;
        for (var j = 0; j < buff; j++) {
          gameList[1].push(response[j].id);
          if (response[j].names.hasOwnProperty('twitch')) {
            gameList[0].push(response[j].names.twitch);
          } else {
            gameList[0].push(response[j].names.international);
          }
        }
      })
  }
  
  gameList = JSON.stringify(gameList, null, '\t');
  fs.writeFileSync(cache_path, gameList);
  console.log('Cache file created')
}//}}}

function loadGameList() { //{{{
  if (!fs.existsSync(cache_path)) {
    getGameList();
  }
  return JSON.parse(fs.readFileSync(cache_path));
} //}}}

function getGameID(gameName, gameList) { //{{{
//Note: work properly!
  // Check for arguments length
  if (arguments.length == 0) {
    return '[Err] Needed name of game!';
  } else if (arguments.length == 1) {
    var gameList = loadGameList();
  } else {
    
  }
  // Search game name in array of names
  var index = gameList[0].indexOf(gameName);
  if (index != -1) {
    return gameList[1][index];
  } else {
    return '[Err] Game not found!';
  }
} //}}}

function getGameRecord(gameID, categories) { //{{{
  
  var recordPs = [];
  // Check for arguments length
  if (arguments.length == 0) {
    return '[Err] Needed ID of the game!';
  } else if (arguments.length == 1) {
    var categories = getGameCategories(gameID);
  } else {
    
  }
  
  console.log(categories);
  var catLength = categories.length;
  for (var i = 0; i < catLength; i++) {
    var p = fetch(`${URL}/api/v1/leaderboards/${gameID}/category/${categories[i]}?_top=1`)
      .then((res) => res.json()).then((json) => json.data);
    console.log(p);
    recordPs.push(p);
  }


  Promise.all(recordPs)
    .then(vals => console.log(vals));
}//}}}

function getGameCategories(gameID) { //{{{
// Note: work properly!
  return fetch(`${URL}/api/v1/games/${gameID}/categories`)
    .then((res) => res.json())
    .then((json) => {
      var data = json.data;
      var catLength = data.length;
      var categories = [[], []];
      for (var i = 0; i < catLength; i++) {
        categories[0].push(data[i].name);
        categories[1].push(data[i].id);
      }
      return categories;
    });
}//}}}

// Test
var options = { //{{{
method: 'GET',
headers: {
  'User-Agent': 'twitch-wr-bot/0.1',
  Accept: 'application/json',
  'content-type': 'application/json',
  connection: 'close'
         },
body: null,
redirect: 'follow',
follow: 20,
timeout: 0,
compress: true,
size: 0,
body: 'string',
agent: null
}; //}}}

// === for chat

function print_data_to_chat(data){//{{{

}//}}}

// ========== tests


//var gameList = loadGameList();

//var gameID = 'lde2m5d3';
var gameName = 'Titanfall'

var gameID = getGameID(gameName);

getGameRecord(gameID)
  /*.then((res) => {
    var test = res;
    console.log(test);
});*/
