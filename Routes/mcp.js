const express = require('express');
const mcpRouter = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');


mcpRouter.get('/bandata/:username', (req, res) => {
    const { username } = req.params;
  
    if(username === "null") {
      res.prettyPrintJson({mcpbandata: []});
    }
    else {
      if (username) {
        db.getUserDataByName(username)
            .then((userData) => {
              if (userData) {
                  var jsonDataUser = JSON.parse(JSON.stringify(userData, null, 2));
                  res.prettyPrintJson({mcpbandata: jsonDataUser.mcpbandata});
                }
                else {
                  res.prettyPrintJson({mcpbandata: []});
                }
            })
            .catch((err) => {
              res.prettyPrintJson({mcpbandata: []});
          });
     }
    }
});
  
































































































module.exports = mcpRouter;