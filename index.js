const express = require('express');
const app = express();
const path = require('path');
const authRoutes = require('./Routes/auth');
const mcpRoutes = require('./Routes/mcp');
const catalogRoutes = require('./Routes/catalog');
const adminRoutes = require('./Routes/admin');
const notifyRoutes = require('./Routes/notifier');
const apiRoutes = require('./Routes/api');
const matchmakingRoutes = require('./Routes/matchmaking');
const cloudstorageRoutes = require('./Routes/cloudstorage');
const launcherRoutes = require('./Routes/launcher');
const merryGoRoundRouter = require('./Routes/merrygoround');
const errorStruct = require('./Structs/error');
const storeFrontRouter = require('./Routes/storefront');
const fs = require('fs');
const CatalogChanger = require('./Catalog/CatalogChanger');
const axios = require('axios');
var testingBackend = true;

var PORT = 20107;
var bLogRequests = false;

// Middleware function for pretty printing JSON
app.use((req, res, next) => {
  if(bLogRequests == true) {
        console.log("Request received: " + req.originalUrl);
  }
  // Custom function to pretty print JSON responses
  res.prettyPrintJson = data => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  };
  next(); 
});

app.get('/', (req, res) => {
  errorStruct.createError("random", "errors.com.epicgames.common.not_found", "Sorry the resource you were trying to find could not be found", res);
});

app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error to the console

  res.status(500).json({ error: 'Something went wrong!' });
});

// Route middlewares
app.use('/user', authRoutes); // Authentication routes
app.use('/mcp', mcpRoutes); // MCP routes
app.use('/catalog', catalogRoutes); // Catalog routes
app.use('/admin', adminRoutes); // Admin routes
app.use('/notify', notifyRoutes); // Notification routes
app.use('/api', apiRoutes); // API Routes
app.use('/matchmaking', matchmakingRoutes); // Matchmaking routes
app.use('/cloudstorage', cloudstorageRoutes); // Cloudstorage routes
app.use('/launcher', launcherRoutes); // Launcher routes
app.use('/merrygoround', merryGoRoundRouter); // merryGoRound (initialization stuff for the frontend/loading phase)
app.use('/fortress/api/storefront/v2', storeFrontRouter); // storefront ( catalog v2 ) router

// item shop.
/* Basically this schedules the item shop changes and the function re-runs every single time the shop re-updates itself */
CatalogChanger.scheduleItemShopUpdate();

const getServerPublicIP = async () => {
  try {
    const response = await axios.get('https://ipinfo.io/json');
    const data = response.data;
    return data.ip;
  } catch (error) {
    console.error('Failed to retrieve public IP:', error);
    return 'Servers Public IP not found';
  }
};

if(testingBackend == true) {
  //PORT = 3888; don't change the port for now.
}


const server = app.listen(PORT, async () => {
  require("./xmpp");
  console.log(`Server is listening on port ${PORT}`);
});

const cdnPath = path.join(__dirname, './cdn/');

app.get('/cdn/:fileName', (req, res) => {
  const filePath = path.join(cdnPath, req.params.fileName);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      errorStruct.createError("random", "errors.com.epicgames.common.not_found", "Sorry the resource you were trying to find could not be found", res);
    } else {
      res.sendFile(filePath);
    }
  });
});

app.get('/cdn/files/array', (req, res) => {
  fs.readdir(cdnPath, (err, files) => {
    if (err) {
      res.status(500).send('Error reading directory');
    } else {
      res.json({ files });
    }
  });
});


// Middleware to handle 404 errors
app.use((req, res, next) => {
  errorStruct.createError("random", "errors.com.epicgames.common.not_found", "Sorry the resource you were trying to find could not be found", res);
});

// Middleware to handle other errors
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error to the console
  res.status(500).json({ error: 'Something went wrong!' });
});