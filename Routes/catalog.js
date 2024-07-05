const express = require('express');
const catalogRouter = express.Router();
const path = require('path');
const fs = require('fs');
const templateStruct = require('../Structs/Template');
const db = require('../db');
const MainPath = __dirname;

catalogRouter.get('/v2/purchase/:username/:cid', (req, res) => {
  const { username, cid } = req.params;

  db.getCurrentShop()
  .then((shop) => {
    if (shop) {
      var jsonData = JSON.parse(JSON.stringify(shop, null, 2));
      var itemData = jsonData.storefronts.find(item => item.catalogEntries.find(offer => offer.RewardId === cid));
      if(itemData != undefined){
        itemData = itemData.catalogEntries.find(offer => offer.RewardId === cid)
      }

      if (itemData == undefined) {
        res.prettyPrintJson({
          result: "failed",
          error: "Failed to find offer: " + cid + " " + "in the item shop. Shop error code 0"
        });
      }
      else {
        db.findProfileByName(username)
        .then((profileathena) => {
          if (profileathena) {
            var Jprofileathena = JSON.parse(JSON.stringify(profileathena, null, 2));
            const LockerItemData = Jprofileathena["items"].find(item => item.TemplateId === cid);

            var finalPrice = itemData.Cost;
            
            if(LockerItemData == undefined) {
              console.log(itemData);
              for (var grant of itemData.itemGrants) {
                  const LockerItemDataCheck = Jprofileathena["items"].find(item => item.TemplateId === grant.templateId);
                  if(LockerItemDataCheck == undefined) {
                    Jprofileathena["items"].push(templateStruct.createTemplate(grant.templateId, [], res));
                  }
                  else {
                    if(grant.priceRemoval != undefined) {
                      finalPrice = finalPrice - grant.priceRemoval;
                    }
                  }
              };

              db.getUserDataByName(username)
              .then((userData) => {
                if (userData) {
                    if(parseInt(userData.vbucks) >= finalPrice) {
                      const newAmount = parseInt(userData.vbucks) - finalPrice;

                      db.updateUserData(username, { vbucks: newAmount.toString() });
                      db.updateProfileAthena(username, { items: Jprofileathena.items });
                      res.prettyPrintJson({result: "success"});
                    }
                    else {
                      const errorMsg = `User: ${username} doesn't have enough v-bucks (${finalPrice}) to purchase ${cid}`

                      res.prettyPrintJson({
                        result: "failed",
                        error: errorMsg
                      });
                    }
                  }
                  else {
                    const errorMsg = "Failed to retreive user data.";

                      res.prettyPrintJson({
                        result: "failed",
                        error: errorMsg
                      });
                  }
              })
              .catch((err) => {
                console.error('Error finding userData:', err);
            });
            }
            else {
              const errorMsg = "User: " + username + " already owns offer: " + cid + " can't add to locker."

              res.prettyPrintJson({
                result: "failed",
                error: errorMsg
              });
            }
          } else {
            res.prettyPrintJson({result: "failed"});
            console.log('profileathena not found.');
          }
        })
        .catch((err) => {
          res.prettyPrintJson({result: "failed"});
          console.error('Error finding profileathena:', err);
        });
      }
    } else {
      res.prettyPrintJson({result: "failed"});
     console.log('Shop not found.');
    }
  })
  .catch((err) => {
    res.prettyPrintJson({result: "Failed"});
    console.error('Error finding Shop:', err);
  });
});


catalogRouter.get('/v2/ownsitem/:username/:cid', (req, res) => {
  const { username, cid } = req.params;
  const hotfixDataPath = path.join(MainPath, './storage/cloudstorage/hotfixes.json');
  const hotfixData = JSON.parse(fs.readFileSync(hotfixDataPath, 'utf8'));

  
  db.findProfileByName(username)
  .then((profileathena) => {
    if (profileathena) {
      var JData = JSON.parse(JSON.stringify(profileathena, null, 2));
      var OldCID = "";
      const HotfixDataOverride = hotfixData.PrimaryAssetIdOverrides.find(override => override.New === cid);

      if(HotfixDataOverride != undefined) {
        OldCID = HotfixDataOverride.Old;
      }

      const itemData = JData.items.find(item => item.TemplateId === cid);
      const itemDataOld = JData.items.find(item => item.TemplateId === OldCID);
    
      if(itemData == undefined && itemDataOld == undefined)
      {
        res.prettyPrintJson({
          result: false
        });
      }
      else{
        res.prettyPrintJson({
          result: true
        });
      }
    } else {
      res.prettyPrintJson({
        result: true
      });
      console.log('profileathena not found.');
    }
  })
  .catch((err) => {
    res.prettyPrintJson({
      result: true
    });
    console.error('Error finding profileathena:', err);
  });
});

catalogRouter.get('/v2/ownsoffer/:username/:offerid', (req, res) => {
  const { username, offerid } = req.params;

  db.getCurrentShop()
  .then((shop) => {
    if (shop) {
      var jsonData = JSON.parse(JSON.stringify(shop, null, 2));
      var itemData = jsonData.storefronts.find(item => item.catalogEntries.find(offer => offer.RewardId === offerid));
      if(itemData != undefined){
        itemData = itemData.catalogEntries.find(offer => offer.RewardId === offerid)
      }

      if (itemData == undefined) {
        res.prettyPrintJson({owned:false});
      }
      else {
        db.findProfileByName(username)
        .then((profileathena) => {
          if (profileathena) {
            var Jprofileathena = JSON.parse(JSON.stringify(profileathena, null, 2));

            var finalPrice = itemData.Cost;

            var amountOfItemsOwned = 0;
            for (var grant of itemData.itemGrants) {
              const LockerItemDataCheck = Jprofileathena["items"].find(item => item.TemplateId === grant.templateId);
              if(LockerItemDataCheck != undefined) {
                amountOfItemsOwned += 1;
              }
          };

          if(amountOfItemsOwned >= itemData.itemGrants.length) {
            res.prettyPrintJson({owned: true});
          }
          else{
            res.prettyPrintJson({owned: false});
          }
          }
        })
        .catch((err) => {
          res.prettyPrintJson({owned: false});
        });
      }
    } else {
      res.prettyPrintJson({owned: false});
    }
  })
  .catch((err) => {
    res.prettyPrintJson({owned: false});
  });
});

const filePath = path.join(__dirname, '../Catalog/Storage/shop.json');

catalogRouter.get('/itemshop', (req, res) => {
    
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

module.exports = catalogRouter;