const express = require('express');
const storeFrontRouter = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../token');

storeFrontRouter.get('/catalog', verifyToken, (req, res) => {
    db.getCurrentShop()
  .then((shop) => {
    if (shop) {
      res.prettyPrintJson(JSON.parse(JSON.stringify(shop,null,2)));
    } else {
      res.prettyPrintJson({result: "Failed"});
     console.log('Shop not found.');
    }
  })
  .catch((err) => {
    res.prettyPrintJson({result: "Failed"});
    console.error('Error finding Shop:', err);
  });
});

storeFrontRouter.get('/keychain', verifyToken, (req, res) => {
    const KeychainData = fs.readFileSync(path.join(__dirname, '../storage/cloudstorage/keychain.json'), 'utf8');
    var KeychainDataJson = JSON.parse(KeychainData);
 
    res.prettyPrintJson(KeychainDataJson);
});

module.exports = storeFrontRouter;