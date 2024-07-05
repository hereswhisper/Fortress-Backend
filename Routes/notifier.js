const express = require('express');
const notifyRouter = express.Router();
const errorStruct = require('../Structs/error');
const fs = require('fs');

notifyRouter.get('/error/frontend', (req, res) => {
    fs.readFile("./data/frontendNotification.json", 'utf8', (readErr, data) => {
        if(readErr)
            console.log("Read error when trying to read notify file: " + readErr);
        else{
            res.prettyPrintJson(JSON.parse(data)); 
        }
    });
});

module.exports = notifyRouter;