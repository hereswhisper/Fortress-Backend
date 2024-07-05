const express = require('express');
const merryGoRoundRouter = express.Router();
    
merryGoRoundRouter.get('/roundandround', (req, res) => {
   res.json({ ArtFile: "5CC7ECBCDBB2442E5C776BE6CDCE30EA926854A2.jpg" });
});

module.exports = merryGoRoundRouter;