const express = require('express');
const matchmakingRouter = express.Router();
const errorStruct = require('../Structs/error');
const templateStruct = require('../Structs/Template');
const equippedStruct = require('../Structs/EquippedTemplate');
const encryptionFunctions = require('../Structs/encryption');
const serverFunctions = require('../Structs/ServerTemplate');
const MainDatabase = require('../db');
const MatchamkingDatabase = require('../db2');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// constants

const serverDir = "./server";
const serversJson = serverDir + "/servers.json";

function addMatchToServerList(port)
{
    fs.readFile(serversJson, (err, data) => {
        if(err)
        {
        }

        var JData = JSON.parse(data);

        JData.push(serverFunctions.createServerTemplate(port, 0, false));

        fs.writeFile(serversJson, JSON.stringify(JData), 'utf-8', (writeErr) => {
            if(writeErr)
            {

            }
        });
    });
}

function removeMatchFromServerList(port)
{
    fs.readFile(serversJson, (err, data) => {
        if(err)
        {

        }

        var JData = JSON.parse(data);
        const serverIndex = JData.findIndex(item => item.serverPort === port);

        if(serverIndex == -1)
        {
            
        }
        else
        {
            JData.splice(serverIndex, 1);

            fs.writeFile(serversJson, JSON.stringify(JData), 'utf-8', (writeErr) => {
                if(writeErr)
                {
    
                }
            });
        }
    });
}

function editMatchFromServerList(port)
{
    fs.readFile(serversJson, (err, data) => {
        if(err)
        {

        }

        var JData = JSON.parse(data);
        const serverIndex = JData.findIndex(item => item.serverPort === parseInt(port));

        if(serverIndex == -1)
        {
            
        }
        else
        {
            JData[serverIndex].players = parseInt(JData[serverIndex].players + 1);

            fs.writeFile(serversJson, JSON.stringify(JData), 'utf-8', (writeErr) => {
                if(writeErr)
                {
    
                }
            });
        }
    });
}


matchmakingRouter.get('/matchmakingactive', (req, res) => {
    res.prettyPrintJson({
        "active": true
    });
});

matchmakingRouter.get('/creatematch/:port/:level/:gamemode/:playlist/:matchid', async (req, res) => {
  const { port, level, gamemode, playlist, matchid } = req.params;

  // Read MatchmakerData from file
  const matchmakerFile = fs.readFileSync(path.join(__dirname, '../storage/CoreData/matchmaker.json'), 'utf8');
  const matchmakerData = JSON.parse(matchmakerFile);
  const naCentralAddress = matchmakerData.NA_Centeral_ADDRESS;
  const naCentralIp = matchmakerData.NA_Centeral_IP;

  const url = `${naCentralAddress}matchcreator/create/${port}/${level}/${gamemode}/${matchid}`;

  try {
      // Send HTTP GET request to App B's endpoint
      const response = await axios.get(url);

      MatchamkingDatabase.addMatchToDB(`${naCentralIp}:${port}`, playlist, 0, true, matchid);

      res.json({success: true, match: {IPandPort: `${naCentralIp}:${port}`}});
  } catch (error) {
      console.error('Error triggering match creation:', error);
      errorStruct.createError("random", "fortress.matchmaker.creatematch", "We failed to trigger the match creation process. Please try again later.", res);
  }
});

matchmakingRouter.get("/findmatch/:playlist", (req, res) => {
    const requestedPlaylist = req.params.playlist; // Extract the playlist parameter from the request
    MatchamkingDatabase.getMatches()
    .then((matches) => {
      if (matches) {
        let matchingMatch = null;
        const ParsedMatches = JSON.parse(matches);
        for (const match of ParsedMatches) {
            if (match.Playlist === requestedPlaylist && // Check if the playlist matches
                !match.bHasBusLaunched &&
                match.CurrentPlayers < 100 &&
                match.bAllowingPlayers) {
                matchingMatch = match;
                break;
            }
        }
        if (matchingMatch) {
            res.json({ success: true, match: matchingMatch });
        } else {
            res.json({ success: false, message: "No matching match found." });
        }
      } else {
          res.json({ success: false, message: "No matches found." });
      }
    })
    .catch((err) => {
      console.error('Error finding matches:', err);
      res.status(500).json({ success: false, error: "Internal server error" });
  });
});

matchmakingRouter.get('/getmatches', (req, res) => {
    MatchamkingDatabase.getMatches()
    .then((matches) => {
      if (matches) {
        const ParsedMatches = JSON.parse(matches);
        res.json(ParsedMatches);
      }
    })
    .catch((err) => {
      console.error('Error finding matches:', err);
      res.status(500).json({ success: false, error: "Internal server error" });
  });
});

matchmakingRouter.get('/addplayer/:port', (req, res) => {
    const { port } = req.params;

    editMatchFromServerList(port);

    res.prettyPrintJson({
        code: 200
    });
});

matchmakingRouter.get('/competitive/details/:CompetitiveDetailIdentifier', (req, res) => {

    const { CompetitiveDetailIdentifier } = req.params;

    MatchamkingDatabase.getTournamentDetails(CompetitiveDetailIdentifier)
    .then((tournamentDetails) => {
      if (tournamentDetails) {
        const ParsedTournamentDetails = JSON.parse(tournamentDetails);
        res.json(ParsedTournamentDetails);
      }
      else {
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    })
    .catch((err) => {
      console.error('Error finding tournamentDetails:', err);
      res.status(500).json({ success: false, error: "Internal server error" });
  });
});

matchmakingRouter.get('/competitive/player/details/:accountId/:CompetitiveDetailIdentifier', (req, res) => {
    const { accountId, CompetitiveDetailIdentifier } = req.params;
  
    MatchamkingDatabase.getTournamentDetails(CompetitiveDetailIdentifier)
      .then((tournamentDetails) => {
        if (tournamentDetails) {
          const ParsedTournamentDetails = JSON.parse(tournamentDetails);
  
          // Find the player's details in the Placements array
          const playerPlacement = ParsedTournamentDetails.Placements.find((placement) => placement.Player === accountId);
  
          if (playerPlacement) {
            // Send the player's placement details as JSON response
            res.json({Details: playerPlacement, success: true});
          } else {
            // If player's details are not found, send an error response
            res.status(404).json({ success: false, error: "Player details not found" });
          }
        } else {
          res.status(500).json({ success: false, error: "Internal server error" });
        }
      })
      .catch((err) => {
        console.error('Error finding tournamentDetails:', err);
        res.status(500).json({ success: false, error: "Internal server error" });
      });
});

matchmakingRouter.get('/playlist/getdata/:playlistIdentifier', (req, res) => {
  const { playlistIdentifier } = req.params;

  const hotfixData = fs.readFileSync("./storage/cloudstorage/hotfixes.json", 'utf8');
  const hotfixDataParsed = JSON.parse(hotfixData);

  const foundPlaylist = hotfixDataParsed.DynamicPlaylists.find((Playlist) => Playlist.PlaylistIdentifier === playlistIdentifier);

  if(foundPlaylist) {
    res.json({success: true, playlistData: foundPlaylist});
  }
  else {
    res.json({success: false, fallBackPlaylist: hotfixDataParsed.FallbackPlaylist});
  }
});

matchmakingRouter.get('/competitive/player/setscore/:accountId/:CompetitiveDetailIdentifier/:newScore', (req, res) => {
  const { accountId, CompetitiveDetailIdentifier, newScore } = req.params;
  
  MatchamkingDatabase.getTournamentDetails(CompetitiveDetailIdentifier)
    .then((tournamentDetails) => {
      if (tournamentDetails) {
        const ParsedTournamentDetails = JSON.parse(tournamentDetails);

        // Find the player's details in the Placements array
        var PlacementsArray = ParsedTournamentDetails.Placements;
        var playerIndex = PlacementsArray.findIndex((placement) => placement.Player === accountId);

        if (playerIndex != -1) {
          // Send the player's placement details as JSON response
          PlacementsArray[playerIndex].Score = parseInt(newScore);

          MatchamkingDatabase.updateTournamentDetails(CompetitiveDetailIdentifier, {Placements: PlacementsArray});

          res.json({success: true});
        } else {
          MainDatabase.getUserDataById(accountId)
          .then((userData) => {
            if (userData) {
                PlacementsArray.push({Score: parseInt(newScore), Player: accountId, CompetiterNamesCombined: userData.username});
                MatchamkingDatabase.updateTournamentDetails(CompetitiveDetailIdentifier, {Placements: PlacementsArray});
                res.status(200).json({ success: true });
              }
              else {
                res.prettyPrintJson('Failed'); // remake when possible
              }
          })
          .catch((err) => {
            console.error('Error finding userData:', err);
          });
        }
      } else {
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    })
    .catch((err) => {
      console.error('Error finding tournamentDetails:', err);
      res.status(500).json({ success: false, error: "Internal server error" });
    });
});

module.exports = matchmakingRouter;