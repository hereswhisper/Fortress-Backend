const express = require('express');
const launcherRouter = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

launcherRouter.get('/createuuid', (req, res) => {
    const uuid = uuidv4();
    console.log(`Generated UUID: ${uuid}`)
    res.json({ uuid: uuid });
});

launcherRouter.get('/userfromid/:name', (req, res) => {
    db.getUserIdFromName(req.params.name)
    .then((user) => {
      if (user) {
        res.prettyPrintJson({result: 'success', id: user.id});
      } else {
        res.prettyPrintJson({result: 'failed'});
      }
    })
    .catch((err) => {
      res.prettyPrintJson({result: 'failed'});
    });
});

module.exports = launcherRouter;