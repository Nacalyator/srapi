'use strict';
// const fetch = require('node-fetch');
import fetch from 'node-fetch';

// ========== data {{{
const SERVER = "www.speedrun.com"
const URL = `https://${SERVER}`
//}}}

// ========== api

// === for speedrun

function get_game_data(max) { //{{{
  return fetch(`${URL}/api/v1/games?_bulk=yes&max=${max}`)
    .then((res) => res.json())
    .then((json) => {
      return json.data;
    })
}//}}}

function get_game_record(url){//{{{

}//}}}

// === for chat

function print_data_to_chat(data){//{{{

}//}}}


// ========== tests

get_game_data(199).then((res) => {
  console.log(res.length === 199);
});
