const express = require('express');
const authRouter = express.Router();
const errorStruct = require('../Structs/error');
const templateStruct = require('../Structs/Template');
const equippedStruct = require('../Structs/EquippedTemplate');
const encryptionFunctions = require('../Structs/encryption');
const VariantStruct = require('../Structs/variantData');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('../db');
const { verifyToken, secretKey } = require('../token');

authRouter.use(bodyParser.json());

authRouter.all('/sessionvalidation/:sessionguid', (req, res) =>
{
  const { sessionguid } = req.params;

    db.getUserBySession(sessionguid)
        .then((user) => {
          if (user) {
            res.prettyPrintJson({valid: true});
          } else {
            res.prettyPrintJson({valid: false});
            console.log('session not found.');
          }
        })
        .catch((err) => {
          res.prettyPrintJson({valid: false});
          console.error('Invalid session:', err);
    });
}); // v2

authRouter.all("/savevbucks/:username/:amount", (req, res) =>
{
    const { username, amount } = req.params;

  if (username) {
    res.prettyPrintJson('Failed'); // remake when possible
  }
}); // v2

authRouter.all('/redeembattlepassreward/:ItemID/:accountid', (req, res) => {
  const { ItemID, accountid } = req.params;

  const hotfixData = fs.readFileSync("./storage/cloudstorage/hotfixes.json", 'utf8');
  const hotfixDataParsed = JSON.parse(hotfixData);

  const FoundBattlePassItem = hotfixDataParsed.BattlePass.Rewards.find((BattlePassArrItem) => BattlePassArrItem.Reward === ItemID);

  db.findProfileById(accountid)
  .then((profileathena) => {
    if (profileathena && FoundBattlePassItem) {
      const LockerItemData = profileathena["items"].find(item => item.TemplateId === ItemID);

      if(LockerItemData == undefined) {
        var jsonData = JSON.parse(JSON.stringify(profileathena,null,2));
      
        jsonData["items"].push(templateStruct.createTemplate(ItemID, []));
  
        db.updateProfileAthenaById(accountid, { items: jsonData.items });
        const accountIdentifier = jsonData.accountId;
  
        console.log("getting offline purchases data.");
        db.getOfflinePurchases(accountIdentifier)
        .then((offlinepurchasesprofile) => {
          if (offlinepurchasesprofile) {
            var jsonData2 = JSON.parse(JSON.stringify(offlinepurchasesprofile, null, 2));
            jsonData2["OfflinePurchases"].push({ItemPID: ItemID, SpecificVariants: []});
            jsonData2["accountId"] = accountIdentifier;
  
            db.updateOfflinePurchase(accountIdentifier, {OfflinePurchases: jsonData2.OfflinePurchases, accountId: accountIdentifier});
          } else {
  
            db.addOfflinePurchase(accountIdentifier, [{ItemPID: ItemID, SpecificVariants: []}], accountIdentifier);
            console.log('offline purchases not found.');
          }
        })
        .catch((err) => {
          console.error('Error finding offline purchases:', err);
      });
      }

      const userData = {
        success: true
      };
      res.prettyPrintJson(userData);
    } else {
      res.prettyPrintJson({success: false});
      console.log('profileathena not found.');
    }
  })
  .catch((err) => {
    res.prettyPrintJson({success: false});
    console.error('Error finding profileathena:', err);
  });
});

authRouter.all('/info/:username', (req, res) => {
    const { username } = req.params;
    console.log(req.body);

  if (username) {
    db.getUserDataByName(username)
        .then((userData) => {
          if (userData) {
            const userDataF = {
              id: userData.id,
              username: userData.username,
              vbucks: userData.vbucks,
              arenapoints: userData.arenapoints,
              playlist: userData.playlist,
              result: 'success'
            };
            res.prettyPrintJson(userDataF);
          } else {
            res.prettyPrintJson({result: "Failed"});
            console.log('userData not found.');
          }
        })
        .catch((err) => {
          res.prettyPrintJson({result: "Failed"});
          console.error('Error finding userData:', err);
      });
  }
}); // v2
const jwt = require('jsonwebtoken');
authRouter.all('/login/:username/:password', (req, res) => {
  const { username, password } = req.params;
  
  if (username) {
    db.getUserDataByName(username)
      .then((userData) => {
        if (userData) {
          if(encryptionFunctions.decrypt(userData.password) === password) {
            const token = jwt.sign({ id: userData.id, username: userData.username }, secretKey, { expiresIn: '30m' });

            res.json({ 
              authorizationCode: token,
              id: userData.id,
              username: userData.username,
              vbucks: userData.vbucks,
              arenapoints: userData.arenapoints,
              result: 'success'
            });
          } else {
            res.json({ result: 'failed' });
          }
        } else {
          res.json({ result: 'failed' });
        }
      })
      .catch((err) => {
        res.json({ result: 'failed' });
        console.error('Error finding userData:', err);
      });
  }
});

authRouter.all('/register/:username/:password', (req, res) => {
    const { username, password } = req.params;

    const newUser = {
        id: "3",
        username: username,
        password: encryptionFunctions.encrypt(password),
        session: "none",
        staff: "yes",
        demonpartner: "no",
        skinid: "0",
        banned: "no",
        timeuntilunban: "",
        disabled: "no",
        vbucks: "0",
        arenapoints: "0",
        mcpbandata: [],
        skins: "",
        backblings: "BID_Empty",
        backbling: "",
        LoadingScreens: "LoadingScreen_Default",
        banreason: "test discord ban",
        level: "0",
        cid: "",
        loadingscreen: "None",
        musicpack: "",
        musicpacks: "",
        sac: "",
        variantnumber: "0",
        email: "none",
        discordid: "1",
        ip: "",
        playlist: "AthenaPlaylist:GrassyTestBed_001" // default play list
    };

    db.getUserDataByName(username)
        .then((userData) => {
          if (userData) {
            res.prettyPrintJson({message: "Failed"});
          } else {
            db.createUser(newUser);
            res.prettyPrintJson({message: "Account created successfully"});
          }
        })
        .catch((err) => {
          res.prettyPrintJson({message: "Failed"});
        console.error('Error finding userData:', err);
    });

}); // v2


authRouter.all('/updateprofile/athena/:accountid', verifyToken, (req, res) => {
    const accountid = req.userId;
    console.log(req.body);
    if (accountid) {
      db.findProfileById(accountid)
      .then((profileathena) => {
        if (profileathena) {
          var Jprofileathena = JSON.parse(JSON.stringify(profileathena, null, 2));
          const LockerItemData1 = Jprofileathena["items"].find(item => item.TemplateId && item.TemplateId.includes(req.body.Character));
          const LockerItemData2 = Jprofileathena["items"].find(item => item.TemplateId && item.TemplateId.includes(req.body.Backpack));
          const LockerItemData3 = Jprofileathena["items"].find(item => item.TemplateId && item.TemplateId.includes(req.body.Pickaxe));

          var jsonData = JSON.parse(JSON.stringify(profileathena,null,2));
          
          jsonData["equipped"]["Character"] = equippedStruct.createEquippedTemplate(parseInt(req.body.CharacterVariant, 10), req.body.Character, req.body.MCPCharacterVariant);
          jsonData["equipped"]["Emotes"] = req.body.EmoteIds;
          
          const ItemIndex = jsonData.items.findIndex(item => item.TemplateId === "AthenaCharacter:" + req.body.Character);
          if(ItemIndex != -1) {
            jsonData["items"][ItemIndex]["CosmeticVariant"] = req.body.MCPCharacterVariant;
          }

          jsonData["equipped"]["Backpack"] = equippedStruct.createEquippedTemplate(parseInt(req.body.BackpackVariant, 10), req.body.Backpack, []);
          jsonData["equipped"]["Pickaxe"] = equippedStruct.createEquippedTemplate(parseInt(req.body.PickaxeVariant, 10), req.body.Pickaxe, []);

          db.updateProfileAthenaById(accountid, { equipped: jsonData.equipped, items: jsonData.items });

          const userData = {
            result: 'success'
          };
          res.prettyPrintJson(userData);
        } else {
          res.prettyPrintJson({result: "Failed"});
          console.log('profileathena not found.');
        }
      })
      .catch((err) => {
        res.prettyPrintJson({result: "Failed"});
        console.error('Error finding profileathena:', err);
      });
    }
}); // v2


authRouter.all('/updatesession/:username', verifyToken, (req, res) =>
{
    const username = req.username;
    
    console.log(req.body)
  
    if (username) {

      db.updateUser(username, { session: req.body.session });
      res.prettyPrintJson({result: "success"});
    }
}); // v2

authRouter.all('/profileservice/:username/athena', verifyToken, (req, res) =>{
  const username = req.username;

  {
    if (username) {
      db.findProfileByName(username)
          .then((profileathena) => {
            if (profileathena) {
              
              res.prettyPrintJson(JSON.parse(JSON.stringify(profileathena, null, 2)));
            } else {
              res.prettyPrintJson({result: "Failed"});
              console.log('profileathena not found.');
            }
          })
          .catch((err) => {
            res.prettyPrintJson({result: "Failed"});
            console.error('Error finding profileathena:', err);
      });
    }
  } 
 
}); // v2

authRouter.all('/offline/purchases/:accountId', (req, res) => {
  const { accountId, id } = req.params;

  if (accountId) {
    
    const accountIdentifier = accountId;
    db.getOfflinePurchases(accountIdentifier)
        .then((offlinepurchasesprofile) => {
          if (offlinepurchasesprofile) {
            var jsonData = JSON.parse(JSON.stringify(offlinepurchasesprofile, null, 2));
            res.prettyPrintJson(jsonData);
          } else {
            res.prettyPrintJson({accountId: accountIdentifier, OfflinePurchases: []});
            console.log('offline purchases not found.');
          }
        })
        .catch((err) => {
          res.prettyPrintJson({accountId: accountIdentifier, OfflinePurchases: []});
          console.error('Error finding offline purchases:', err);
    });
  } 
});

authRouter.all('/offline/purchases/clear/:accountId', (req, res) => {
  const { accountId, id } = req.params;

  if (accountId) {
    const accountIdentifier = accountId;
    db.clearOfflinePurchases(accountIdentifier)
        .then((offlinepurchasesprofile) => {
          res.prettyPrintJson({accountId: accountIdentifier, OfflinePurchases: []});
        })
        .catch((err) => {
          res.prettyPrintJson({accountId: accountIdentifier, OfflinePurchases: []});
          console.error('Error finding offline purchases:', err);
    });
  } 
});

authRouter.all('/resetpassword/:username/:password', (req, res) => {
  const { username, password } = req.params;
  
  if (username) {
     // redo when can.
  }
}); // v2

authRouter.all('/player/playlist/setcurrentplaylist/:accountId/:PlaylistId', (req, res) => {
  const { accountId, PlaylistId } = req.params;

  db.updateUserDataById(accountId, { playlist: PlaylistId.toString() });
  res.prettyPrintJson({result: "success"});
});

authRouter.get('/quests/complete/:accountid/:questcompletiontag', async (req, res) => {
  const { accountid, questcompletiontag } = req.params;

  const FortressPageData = fs.readFileSync(path.join(__dirname, '../storage/cloudstorage/pages/fortress-game.json'), 'utf8');
  const JsonFortressPageData = JSON.parse(FortressPageData);

  const questsArray = JsonFortressPageData["battleroyalequests"]["questSections"];

  let questsData = [];
  let rewards = [];

  // Collect quests data from the JSON file based on the completion tag
  questsArray.forEach(section => {
    section.quests.forEach(quest => {
      if (quest.completionTag === questcompletiontag) {
        questsData.push({ 
          sectionId: section.SectionId, 
          questId: quest.questId, 
          QuestCount: quest.QuestCount,
          type: quest.type,
          reward: quest.reward 
        });
      }
    });
  });

  try {
    // For each quest data, check the completed quests for the relevant section
    for (const questData of questsData) {
      const completedQuestsInSection = await db.getCompletedQuests(accountid, questData.sectionId);

      const completedQuest = completedQuestsInSection.find(quest => quest.questId === questData.questId);

      // Check if the quest is not completed
      // if (!completedQuest || completedQuest.amount < questData.QuestCount) {
      // use the code above if you don't want players having to complete EVERY action to get the reward ( code above rewards for every action )
      if (completedQuest && completedQuest.amount == questData.QuestCount - 1) {
        rewards.push({ type: questData.type, reward: questData.reward });
      }
    }

    // Update the user's quest data in the database
    const result = await db.updateQuestData(accountid, questsData);

    if (result !== undefined) {
      res.status(200).json({ message: 'Quest completion tags updated successfully', accountid, questcompletiontag, rewards });
    } else {
      res.status(500).json({ message: 'Failed to update quest data' });
    }
  } catch (error) {
    console.error('Error updating quest data:', error);
    res.status(500).json({ message: 'Failed to update quest data', error });
  }
});


authRouter.get('/quests/get/:accountid/:sectionid', async (req, res) => {
  const { accountid, sectionid } = req.params;

  try {
    // Call db.getcompletedquestsinsection function
    const completedQuests = await db.getCompletedQuests(accountid, sectionid);

    if (completedQuests && completedQuests.length > 0) {
      res.status(200).json({ completed: completedQuests });
    } else {
      res.status(200).json({ completed: [] }); // No completed quests
    }
  } catch (error) {
    console.error('Error getting completed quests:', error);
    res.status(500).json({ message: 'Failed to get completed quests', error });
  }
});

authRouter.get('/friends/api/v1/query/:query/:accountid', async (req, res) => {
  const { query, accountid } = req.params;

  try {
    const results = await db.findProfilesByName(query, accountid);
    res.json({result: results});
  } catch (error) {
    console.error('Error searching for profiles:', error);
    res.status(500).json({ error: 'An error occurred while searching for profiles.' });
  }
});

authRouter.get('/friends/api/v1/requests/:accountId', async (req, res) => {
  const { accountId } = req.params;

  try {
    const requests = await db.getFriendRequests(accountId);
    res.json({ requests });
  } catch (err) {
    console.error('Error handling friend requests request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = authRouter;