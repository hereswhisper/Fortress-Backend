const express = require('express');
const apiRouter = express.Router();
const path = require('path');
const fs = require('fs');
const errorStruct = require('../Structs/error');
const axios = require('axios');

apiRouter.get('/v1/fortnitehotfixes', (req, res) => {
   const hotfixData = fs.readFileSync("./storage/cloudstorage/hotfixes.json", 'utf8');

   res.prettyPrintJson(JSON.parse(hotfixData)); 
});

apiRouter.get('/v1/hotfix', (req, res) => {
    const hotfixData = fs.readFileSync(path.join(__dirname, "../storage/cloudstorage/hotfixes.json"), 'utf8');

    res.prettyPrintJson(JSON.parse(hotfixData)); 
});

apiRouter.get('/v1/dynamiclevels/:hostLevelName', (req, res) => {
   const { hostLevelName } = req.params;

   const DynamicSubLevels = JSON.parse(fs.readFileSync("./storage/cloudstorage/dynamicLevels.json", 'utf8'))["DynamicSubLevels"];
   var DynamicSubLevelsForHostLevel = undefined;

   try {
      DynamicSubLevelsForHostLevel = DynamicSubLevels[hostLevelName];
   }
   catch {}

   if(DynamicSubLevelsForHostLevel == undefined) {
      res.prettyPrintJson({Levels: []});
   }
   else {
      res.prettyPrintJson(DynamicSubLevelsForHostLevel);
   }
});

apiRouter.get('/v1/datarouter/discord/:detected/:username', (req, res) => {
   const { detected, username } = req.params;
   const webhookURL = 'https://discord.com/api/webhooks/1212783426923663430/6vmnXnDE-VU-caDsmgRXPw4jJD5Ots7dA7M2xfohvK3APm7ww7a7lRcxHdRujekOYRY_';
   
   // Construct the embed message
   const embed = {
       embeds: [{
           title: "EasyGuard",
           color: 0xff0000, // Red color
           fields: [
               {
                   name: "Detected Possible Hack",
                   value: detected
               },
               {
                   name: "Player name:",
                   value: username
               }
           ]
       }]
   };

   sendWebhook(webhookURL, embed)
       .then(() => {
           console.log('Webhook sent successfully');
           res.status(200).json({ success: true, message: 'Webhook sent successfully' });
       })
       .catch(error => {
           console.error('Error sending webhook:', error);
           res.status(500).json({ success: false, message: 'Failed to send webhook' });
       });
});

apiRouter.get('/v1/configs/:config', (req, res) => {
    const { config } = req.params;

    const configData = fs.readFileSync(path.join(__dirname, `../storage/cloudstorage/configs/${config}.ini`), 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(configData); 
});

function sendWebhook(webhookURL, message) {
   return axios.post(webhookURL, message);
}

module.exports = apiRouter;