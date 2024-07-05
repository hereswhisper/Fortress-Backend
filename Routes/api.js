const express = require('express');
const apiRouter = express.Router();
const path = require('path');
const fs = require('fs');
const errorStruct = require('../Structs/error');
const gameData = require('../storage/gameData');
const lightSwitch = require('../storage/lightSwitch');
const db2 = require('../db2');
    
// Allow CORS
apiRouter.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

apiRouter.get('/v1/easyguard.dll', (req, res) => {
   res.sendFile(path.join(__dirname, '../storage/anticheat/EasyGuard.dll'));
   return;
});

apiRouter.get('/v1/games', (req, res) => {
   db2.getGames()
        .then((user) => {
          if (user) {
            res.prettyPrintJson(JSON.parse(user));
          } else {
            res.prettyPrintJson({result: 'failed'});
            console.log('session not found.');
          }
        })
        .catch((err) => {
          res.prettyPrintJson({result: 'failed'});
          console.error('Invalid session:', err);
    });
});

apiRouter.get('/v1/gamedata', (req, res) => {
   res.json(gameData.fetchGameData());
});

apiRouter.get('/v1/lightswitch', (req, res) => {
   res.json(lightSwitch.fetchData());
});

apiRouter.get('/v1/keyart', (req, res) => {
   res.json({ KeyArtID: "5CC7ECBCDBB2442E5C776BE6CDCE30EA926854A2.jpg" });
});

apiRouter.get('/v1/launcher', (req, res) => {
   res.json({ "latestVersion": "1.0.12", "latestDownloadURL": "http://198.251.67.181:4005/downloads/launcher.zip" })
});

apiRouter.get('/v1/version', (req, res) => {
   const VersionData = fs.readFileSync(path.join(__dirname, '../storage/CoreData/version.json'), 'utf8');
   var JsonVersionData = JSON.parse(VersionData);
   JsonVersionData.serverDate = new Date().toISOString();

   res.prettyPrintJson(JsonVersionData);
});

apiRouter.get('/v1/games/owned/:accountId', (req, res) => {
   const { accountId } = req.params;

   
});

apiRouter.get('/v1/pages/fortnite-game/:section', (req, res) => {
   const VersionData = fs.readFileSync(path.join(__dirname, '../storage/CoreData/version.json'), 'utf8');
   var JsonVersionData = JSON.parse(VersionData);
   JsonVersionData.serverDate = new Date().toISOString();

   res.prettyPrintJson(JsonVersionData);
});

apiRouter.get('/v1/pages/fortress-game', (req, res) => {
   const FortressPageData = fs.readFileSync(path.join(__dirname, '../storage/cloudstorage/pages/fortress-game.json'), 'utf8');
   var JsonFortressPageData = JSON.parse(FortressPageData);

   res.prettyPrintJson(JsonFortressPageData);
});

apiRouter.get('/v1/pages/fortress-game/:section', (req, res) => {
   const { section } = req.params;
    
   const FortressPageData = fs.readFileSync(path.join(__dirname, '../storage/cloudstorage/pages/fortress-game.json'), 'utf8');
   var JsonFortressPageData = JSON.parse(FortressPageData);

   res.prettyPrintJson(JsonFortressPageData[section]);
});

apiRouter.get('/v1/modes', (req, res) => {
   const FortressModesData = fs.readFileSync(path.join(__dirname, '../storage/cloudstorage/modes.json'), 'utf8');
   var JsonFortressModesData = JSON.parse(FortressModesData);

   res.prettyPrintJson(JsonFortressModesData);
});

module.exports = apiRouter;