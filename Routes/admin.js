const express = require('express');
const adminRouter = express.Router();
const path = require('path');
const fs = require('fs');
const errorStruct = require('../Structs/error');
const db = require('../db');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

adminRouter.use(bodyParser.json());

function genMCPBanData(daysBanned, reason) {
  // Get the current UTC date and time
  const currentUTCDate = new Date();
  const currentUTCDay = currentUTCDate.getUTCDate();
  const currentUTCMonth = currentUTCDate.getUTCMonth(); // Month is zero-based, so add 1
  const currentUTCYear = currentUTCDate.getUTCFullYear();
  const currentUTCHour = currentUTCDate.getUTCHours();
  const currentUTCMinute = currentUTCDate.getUTCMinutes();

  // Parse the 'daysBanned' parameter to ensure it's a number
  const daysBannedNumber = parseInt(daysBanned);

  // Calculate the new UTC date after adding 'daysBanned'
  let newUTCDay = currentUTCDay + daysBannedNumber;
  let newUTCMonth = currentUTCMonth;
  let newUTCYear = currentUTCYear;
  let newUTCHour = currentUTCHour;
  let newUTCMinute = currentUTCMinute;

  // Handle rolling over days into new months and years
  while (newUTCDay > daysInMonth(newUTCMonth, newUTCYear)) {
    newUTCDay -= daysInMonth(newUTCMonth, newUTCYear);
    newUTCMonth++;
    if (newUTCMonth > 11) {
      newUTCMonth = 0;
      newUTCYear++;
    }
  }

  // Create an object with the ban data
  const banData = {
    isCompBan: false,
    unbanDate: `${newUTCDay}-${newUTCHour}-${newUTCMinute}-${parseInt(newUTCMonth + 1)}-${newUTCYear}`,
    reason: reason,
  };

  return banData;
}


function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getUTCDate();
  }

adminRouter.get('/ban/:username/:daysbanned/:compban/:reason', (req, res) => {
    const { username, daysbanned, compban, reason } = req.params;
  
    if (username) {

      db.getUserDataByName(username)
          .then((userData) => {
            if (userData) {
                var jsonDataUser = JSON.parse(JSON.stringify(userData, null, 2));

                jsonDataUser.mcpbandata.push(genMCPBanData(daysbanned, reason));

                db.updateUser(username, { mcpbandata: jsonDataUser.mcpbandata });

                const userData2 = {
                  result: 'success',
                  newBanData: jsonDataUser.mcpbandata
                };
                res.prettyPrintJson(userData2);
              }
              else {
                const userData = {
                  result: 'success',
                  newBanData: []
                };
                res.prettyPrintJson(userData);
              }
          })
          .catch((err) => {
            const userData = {
              result: 'success',
              newBanData: []
            };
            res.prettyPrintJson(userData);
            console.error('Error finding userData:', err);
        });
    } else {
      const userData = {
        result: 'success',
        newBanData: []
      };
      res.prettyPrintJson(userData);
    }
});

adminRouter.get('/unban/:username', (req, res) => {
    const { username } = req.params;
  
    if (username) {

      db.getUserDataByName(username)
          .then((userData) => {
            if (userData) {
                db.updateUser(username, { mcpbandata: [] });

                const userData2 = {
                  result: 'success',
                  newBanData: []
                };
                res.prettyPrintJson(userData2);
              }
              else {
                const userData = {
                  result: 'success',
                  newBanData: []
                };
                res.prettyPrintJson(userData);
              }
          })
          .catch((err) => {
            const userData = {
              result: 'success',
              newBanData: []
            };
            res.prettyPrintJson(userData);
            console.error('Error finding userData:', err);
        });
    } else {
      const userData = {
        result: 'success',
        newBanData: []
      };
      res.prettyPrintJson(userData);
    }
});

adminRouter.use(express.json({ limit: '100mb' })); // Adjust the limit as needed
adminRouter.use(express.urlencoded({ extended: true, limit: '100mb' }));

const uploadDir = path.join(__dirname, '../cdn');

adminRouter.post('/upload/image', (req, res) => {
  const { bearer, image } = req.body;
  console.log(req.body);

  // Check if the bearer token is valid
  if (bearer !== '2285716399691wasgj238a722') {
    return res.status(401).json({ error: 'Invalid bearer token' });
  }

  // Check if the image byte array exists
  if (!image) {
    return res.status(400).json({ error: 'Image byte array is missing' });
  }

  try {
    // Convert image from base64 to buffer
    const imageBuffer = Buffer.from(image, 'base64');

    // Generate a unique GUID
    const uniqueGuid = uuidv4();

    // Define the output file path
    const outputFilePath = path.join(uploadDir, `${uniqueGuid}.png`);

    // Write the image byte array to the file
    fs.writeFileSync(outputFilePath, imageBuffer);

    // Respond with success message and GUID
    res.json({ message: 'File uploaded successfully', guid: uniqueGuid });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = adminRouter;