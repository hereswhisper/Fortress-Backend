const fs = require('fs');
const path = require('path');

function fetchGameData() {
    const gameData = fs.readFileSync(path.join(__dirname, '../storage/gameData.json'), 'utf8');

    return {
        gameData: JSON.parse(gameData)
    }
}

function fetchGameData2() {
    const gameData = fs.readFileSync(path.join(__dirname, '../storage/gameData.json'), 'utf8');

    return {
        gameData: JSON.parse(gameData)
    }
}


module.exports = {
    fetchGameData, fetchGameData2
}