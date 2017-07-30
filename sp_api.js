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
  var gameList = [[], []];
  var paginator = 0;
  
  if (!fs.existsSync(cache_path)) {
    fs.writeFileSync(cache_path);
  }
  
  for (var i = 1; i <=  12; i++) {
    var paginator = paginator * i; 
    fetch(`${URL}/api/v1/games?_bulk=yes&max=1000&offset=${paginator}`)
      .then((res) => res.json)
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

function loadGameList() {
  if (!fs.existsSync(cache_path)) {
    getGameList();
  }
  return JSON.parse(fs.readFileSync(cache_path));
}

function getGameRecord(gameName, gameList){//{{{
  var gameID;
  var index = gameList[0].indexOf(gameName);
  if (index != -1) {
    gameID = gameList[1][index];
  } else {
    console.log("[Error] Game not found!");
    gameID = 0;
  }
  // return fetch(`${URL}/api/v1/games/${gameID}/records?_top=1&scope=full-game&skip-empty=true`)
  return fetch(`${URL}/api/v1/games/${gameID}`)
  
    .then((res) => {
      test = res.json;
      res.json
      
    })
    .then((json) => {
      console.log(json);
      console.log(json.data);
      return json.data;
    });
}//}}}


function getGameRecordTest(gameID){//{{{
  // return fetch(`${URL}/api/v1/games/${gameID}/records?_top=1&scope=full-game&skip-empty=true`)
  // return fetch(`${URL}/api/v1/games/${gameID}`)
  return fetch(`${URL}/api/v1/games/lde2m5d3/categories`)
    .then((res) => {res.json})
    .then((json) => {
      return json.data;
    })
    .catch(function(ex) {
    console.log('parsing failed', ex)
    });
}//}}}





// === for chat

function print_data_to_chat(data){//{{{

}//}}}


// ========== tests

// get_game_data(199).then((res) => {
//   console.log(res.length === 199);
// });

// var gamelist = loadGameList();

var gameID = 'lde2m5d3';




getGameRecordTest(gameID).then((res) => {
    var test = res;
    console.log(test);
});



// get_game_data(23).then((res) => {
  
//   console.log(res.length);
// })