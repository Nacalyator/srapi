'use strict';
const fetch = require('node-fetch');
const fs = require("fs");

const SERVER = "www.speedrun.com";
const URL = `https://${SERVER}`;
const cache_path = './cache.json';
var paginator = 12000;

var data = JSON.parse(fs.readFileSync(cache_path));
// var data = [[], []];

function get_ids() { //{{{
  return fetch(`${URL}/api/v1/games?_bulk=yes&max=1000&offset=${paginator}`)
    .then((res) => res.json())
    .then((json) => {
      return json.data;
    })
}//}}}


get_ids().then((res) =>{
  
  var buff = res.length;
  for (var i = 0; i < buff; i++) {
      data[1].push(res[i].id);
      if (res[i].names.hasOwnProperty('twitch')) {
          data[0].push(res[i].names.twitch);
      } else {
          data[0].push(res[i].names.international);
      }
  }
  data = JSON.stringify(data, null, '\t');
  
  fs.writeFileSync(cache_path, data);
  console.log("GJ");
  // console.log(data[0][5]);
});
