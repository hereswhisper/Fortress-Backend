const fs = require('fs');


const MainPath = __dirname;

function fetchData() {
    const Data = fs.readFileSync(MainPath + "/lightSwitch.json", 'utf8');

    return JSON.parse(Data);
}

module.exports = {
    fetchData
}