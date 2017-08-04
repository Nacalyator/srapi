# srapi - simple speedrun.com API

## Installation
`npm install srapi`

## About
* Synchronous. Based on [sync-request](https://github.com/ForbesLindesay/sync-request)
* Simple

## ToDo
- [ ] Asynchronous version
- [ ] Cache for userID and usernames
- [ ] Search by gamename
- [ ] Optimization

## Usage
```javascript
const srapi = require('srapi')
```
### GET-functions
* getGameList return array with list of game names and ids and write list to JSON-file 'gamelist.json'
```javascript
var gameList = srapi.getGameList()

Output:
[[gameName1, gamename2, ...],
 [gameID1,   gameID2,   ...]]
```

* getPlatformList return array with list of platform names and ids and write list to JSON-file 'platformlist.json'
```javascript
var platformList = srapi.getPlatformList()

Output:
[[platformName1, platformname2, ...],
 [platformID1,   platformID2,   ...]]
```

* getGameID return ID of the game
```javascript
var gameID = srapi.getGameID(gameName[, gameList])

Output:
'gameID'
```
* getGameCategories return array of objects with data about game categories
```javascript
var categories = srapi.getGameCategories(gameID)

Output:
[{name: 'categoryName1', ID: 'categoryID1'},
 {name: 'categoryName2', ID: 'categoryID2'},
 ...]
```

* getGameLeaderboard return array of objects with data about first places in each category
```javascript
var leaderboard = srapi.getGameLeaderboard(gameID[, categories])

Output:
[{gameID: 'gID1', platformID: 'pID1', categoryID: 'cID1', runID: 'rID1', userID: 'uID1', time_s: 'timeInSec1', time_t: 'formatedTime1'},
 {gameID: 'gID2', platformID: 'pID2', categoryID: 'cID2', runID: 'rID2', userID: 'uID2', time_s: 'timeInSec2', time_t: 'formatedTime2'},
 ...]
```

### LOAD-functions
* loadGameList load from 'gamelist.json' and return array of game names and ids (look getGameList)
* loadPlatformList load from 'platformlist.json' and return array with list of platform names and ids (look getPlatformList)

### CONVERT-functions
* platformID2name
```javascript
var platformName = srapi.platformID2name(platformID[, platformList])
```

* userID2name
```javascript
var userName = srapi.userID2name(userID)
```

### SPECIAL-functions
* WR return formated message about 1st places in each category
```javascript
var MSG = srapi.WR(gameName[, gameList])
```
Example:
```javascript
var message = srapi.WR('Dark Souls');

Output:
'Game: 'Dark Souls'. Any% PT41M13S (PC) by CapitaineToinon (CapitaineToinon) || Any% Kiln Skip PT20M45S (PC) by CapitaineToinon (CapitaineToinon) || All Bosses PT1H10M46S (PC) by Kahmul (kahmul78) || All Achievements PT4H50M38S (PC) by NaxHPL (naxhpl)'
```
