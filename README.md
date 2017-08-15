# srapi - simple speedrun.com API

## Installation
`npm install srapi`

## About
This is NodeJS module for [speedrun.com](https://www.speedrun.com) API v1.
Features:
* Synchronous. Based on [sync-request](https://github.com/ForbesLindesay/sync-request)
* Simple. Addapted to get simple representation of data from site.

## ToDo
- [ ] Asynchronous version
- [x] Search game and users
- [ ] Optimization (too slow):
  - [x] List of games and platforms loads only once
  - [ ] Search games in internal base using [similarity](https://www.npmjs.com/package/similarity)
  - [ ] Increase stability by try-catch
  - [ ] Something else...
- [x] Parsing chat commands
- [x] Logs
- [ ] Add examples

## Usage
```javascript
const srapi = require('srapi')
var API = srapi();
```
