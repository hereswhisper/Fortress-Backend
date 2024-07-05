const moment = require("moment-timezone");
const fs = require("fs");
const schedule = require("node-schedule");
const shopItems = require("../storage/shopItems");
const db = require('../db');
const path = require('path');

// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const MainPath = __dirname;

function generateJsonData() {
    // Generate next day's date at 23:00:00 UTC, without milliseconds
    const nextDayDate = moment().utc().add(1, 'days').hours(23).minutes(0).seconds(0).milliseconds(0).toISOString();
    console.log(nextDayDate);

    // Read the ForcedShop.json file
    var ForcedShopData = fs.readFileSync(path.join(MainPath, "ForcedShops/ForcedShop.json"), 'utf8');
    var ForcedShopDataParsed = JSON.parse(ForcedShopData);

    // Check if the shop is forced and if the end date matches
    if (ForcedShopDataParsed["bEnabled"] == true && ForcedShopDataParsed["expiration"] == nextDayDate) {
        const jsonData = {
            "expiration": nextDayDate,
            "storefronts": ForcedShopDataParsed["storefronts"]
        };

        return JSON.stringify(jsonData, null, 2);
    } else {
        // Read the available items
        var JData = fs.readFileSync(path.join(MainPath, "availableItems.json"), 'utf8');
        var AvailbleItems = JSON.parse(JData);

        // Shuffle the available items
        shuffleArray(AvailbleItems);

        const numberOfItems = Math.min(5, AvailbleItems.length);

        const jsonData = {
            "expiration": nextDayDate,
            "storefronts": AvailbleItems.slice(0, numberOfItems)
        };

        console.log("returning data");
        return JSON.stringify(jsonData, null, 2);
    }
}

function updateShopJson() {
    console.log('Updating item shop.');
    try {
        db.updateShop(JSON.parse(JSON.stringify(JSON.parse(generateJsonData()))));
        console.log('Updated item shop.');
    } catch (error) {
        console.error('Error updating item shop:', error);
    }
}

function scheduleItemShopUpdate() {
    const now = moment().tz('America/Chicago');
    const today6PM = now.clone().hours(18).minutes(0).seconds(0);
    const nextDay6PM = today6PM.clone().add(1, 'days');

    const targetTimeCST = now.isBefore(today6PM) ? today6PM : nextDay6PM;

    console.log(`Scheduling next update at: ${targetTimeCST.format('MM/DD/YYYY, h:mm:ss A')}`);

    const job = schedule.scheduleJob(targetTimeCST.toDate(), () => {
        updateShopJson();
        scheduleItemShopUpdate(); // Reschedule the next update
    });
}

module.exports = {
    scheduleItemShopUpdate
};
