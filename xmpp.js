const WebSocket = require('ws');
const { randomUUID } = require('crypto');
const clients = new Map(); // has to be a Map instead of {} due to non-string keys
const partys = new Map();
const wss = new WebSocket.Server({ port: 81 }); // initiate a new server that listens on port 81
const db = require('./db');

// Define message handlers in an object
const messageHandlers = {
    'auth': handleAuth,
    'partyinvite': handlePartyInvite,
    'retrieveactiveplayers': handleActivePlayers,
    'killConnection': handleKillConnection,
    'disconnectall': handleDisconnectAll,
    'sendfriendrequest': handleSendFriendRequest,
    'acceptfriendrequest': handleAcceptFriendRequest,
    'declinefriendrequest': handleDeclineFriendRequest,
    'retrievefriends': handleRetrieveFriends,
    'updatestatus': handleUpdateStatus,
    'updatecosmeticavatar': handleUpdateCosmeticAvatar,
    'vbucksreward': handleVbucksReward,
    'setlevelandxp': handleSetLevelAndXP,
    'removefriend': handleRemoveFriend,
    'beginmatchmaking': BeginMatchmaking
};

// set up event handlers and do other things upon a client connecting to the server
wss.on('connection', (ws) => {
    // create an id to track the client
    const id = randomUUID();
    clients.set(ws, { id });

    // Handle incoming messages from clients
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);

            // Check if message type has a handler, then call the handler function
            if (message.type && messageHandlers[message.type]) {
                messageHandlers[message.type](ws, message);
            } else {
                console.log('Unhandled message type:', message.type);
            }
        } catch (e) {
            console.log(`${e} -- ${data}`);
        }
    });

    // stop tracking the client upon that client closing the connection
    ws.on('close', () => {
        clients.delete(ws);
    });

    // send the id back to the newly connected client
    ws.send(`You have been assigned id ${id}`);
});

// function for sending a message to every connected client
function serverBroadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// function to get all online players
function getOnlinePlayers() {
    const onlinePlayers = [];
    clients.forEach((clientData, client) => {
        if (clientData.accountId) {
            onlinePlayers.push({
                id: clientData.id,
                accountId: clientData.accountId,
                displayName: clientData.displayName,
                status: clientData.status,
                avatar: clientData.avatar
            });
        }
    });
    return onlinePlayers;
}

// function to get client by account ID
function getClientByAccountId(accountId) {
    for (const [client, clientData] of clients.entries()) {
        if (clientData.accountId === accountId) {
            return { id: clientData.id, ws: client };
        }
    }
    return null;
}

// Message handler functions
function handleAuth(ws, message) {
    if (message.accountId) {
        const existingClient = getClientByAccountId(message.accountId);
        if (existingClient) {
            existingClient.ws.close(3000, "Login Expired Or Logged In Elsewhere"); // Close the older connection
        }

        clients.set(ws, { accountId: message.accountId, displayName: message.displayname, status: "Lobby - 1 / 4", avatar: { templateId: "AthenaCharacter:CID_001_Athena_Commando_F_Default", bInMatchmaking: false } });
        //ws.send(`You have been authenticated with accountId ${message.accountId}`);
    }
}

function findPartyByAccountId(accountId) {
    for (const [partyUUID, party] of partys) {
        if (party.leader.accountId === accountId || party.members.some(member => member.accountId === accountId)) {
            return { partyUUID, party };
        }
    }
    return null;
}

function sendPartyInvite(targetClient, partyUUID, from) {
    const inviteMessage = {
        type: 'alert',
        partyUUID: partyUUID,
        from: from.UsernameFrom,
        header: 'Party Invitation',
        text: `${from.UsernameFrom} has invited you to join their party.`
    };
    targetClient.send(JSON.stringify(inviteMessage));
}

function handlePartyInvite(ws, message) {
    const { accountIdFrom, accountId, UsernameFrom, CosmeticInformationForSender } = message;

    const fromClient = getClientByAccountId(accountIdFrom);
    const toClient = getClientByAccountId(accountId);

    if (!fromClient || !toClient) {
        ws.send(JSON.stringify({ type: 'alert', header: 'Error', text: 'Invalid account ID(s).' }));
        return;
    }

    const fromParty = findPartyByAccountId(accountIdFrom);

    if (fromParty) {
        if (fromParty.party.members.length < 4) {
            // Send party invite to target
            sendPartyInvite(toClient.ws, fromParty.partyUUID, { accountIdFrom, UsernameFrom });
        } else {
            const partyFullMessage = {
                type: 'alert',
                header: 'Party Full',
                text: `Your party is full. Cannot invite more members.`,
                bShowPlayerIcon: false
            };
            ws.send(JSON.stringify(partyFullMessage));
        }
    } else {
        // Create a new party with sender as the leader and send invite to target
        const partyUUID = randomUUID();
        const newParty = {
            leader: { accountId: accountIdFrom, username: UsernameFrom },
            members: [
                {
                    accountId: accountIdFrom,
                    username: UsernameFrom,
                    cosmeticInformation: CosmeticInformationForSender
                }
            ]
        };
        partys.set(partyUUID, newParty);
        sendPartyInvite(toClient.ws, partyUUID, { accountIdFrom, UsernameFrom });
    }
}

function handleActivePlayers(ws) {
    const senderId = clients.get(ws).id;
    const onlinePlayers = getOnlinePlayers();

    const responseMessage = {
        type: 'activeplayers',
        senderId: senderId,
        players: onlinePlayers,
    };
    ws.send(JSON.stringify(responseMessage));
}

function handleKillConnection(message) {
    const existingClient = getClientByAccountId(message.accountId);
    if(existingClient) {
        clients.delete(existingClient);
        existingClient.ws.close(3000, "Server has requested that you disconnect."); // Close the older connection
    }
}

function handleDisconnectAll() {
    clients.forEach((clientData, client) => {
        if (clientData.accountId) {
            client.close(3000, "Server has requested that you disconnect.");
        }
    });
}

async function handleSendFriendRequest(ws, message) {
    const { AccountIdFrom, AccountIdTo, UsernameFrom } = message;

    // Check if the recipient is online
    const targetClient = getClientByAccountId(AccountIdTo);
    if (targetClient) {
        const alertMessage = {
            type: 'alert',
            header: 'Friend Request',
            text: `<Username>${UsernameFrom}</> sent you a Friend Request`,
            bShowPlayerIcon: true
        };
        targetClient.ws.send(JSON.stringify(alertMessage));
    }

    const SentSuccessAlertMessage = {
        type: 'alert',
        header: 'Successfully Sent',
        text: `Successfully sent Friend Request!`,
        bShowPlayerIcon: false
    };
    ws.send(JSON.stringify(SentSuccessAlertMessage));

    // Add friend request to the database
    await db.addFriendRequest(AccountIdFrom, AccountIdTo, UsernameFrom);
}

async function handleAcceptFriendRequest(ws, message) {
    const { AccountIdFrom, AccountIdTo } = message;

    try {
        // Get sender's username from database
        const senderData = await db.getUserDataById(AccountIdFrom);
        const senderUsername = senderData ? senderData.username : 'Unknown User';

        const SentToData = await db.getUserDataById(AccountIdTo);
        const SentToDataUsername = SentToData ? SentToData.username : 'Unknown User';

        // Check if the sender is online
        const senderClient = getClientByAccountId(AccountIdFrom);
        if (senderClient) {
            const alertMessage = {
                type: 'alert',
                header: 'Friend Request Accepted',
                text: `Your Friend Request to <Username>${SentToDataUsername}</> has been accepted`,
                bShowPlayerIcon: false
            };
            senderClient.ws.send(JSON.stringify(alertMessage));
        }

        const SentToAlertMessage = {
            type: 'alert',
            header: 'Friend Request Accepted',
            text: `Successfully accepted <Username>${senderUsername}</>'s Friend Request!`,
            bShowPlayerIcon: false
        };
        ws.send(JSON.stringify(SentToAlertMessage));

        // Add friend relationship to the database
        await db.addFriend(AccountIdFrom, AccountIdTo);
    } catch (err) {
        console.error('Error accepting friend request:', err);
    }
}

async function handleDeclineFriendRequest(ws, message) {
    const { AccountIdFrom, AccountIdTo } = message;

    try {
        // Get sender's username from database
        const senderData = await db.getUserDataById(AccountIdFrom);
        const senderUsername = senderData ? senderData.username : 'Unknown User';

        const SentToData = await db.getUserDataById(AccountIdTo);
        const SentToDataUsername = SentToData ? SentToData.username : 'Unknown User';

        // Check if the sender is online
        const senderClient = getClientByAccountId(AccountIdFrom);
        if (senderClient) {
            const alertMessage = {
                type: 'alert',
                header: 'Friend Request Declined',
                text: `Your Friend Request to <Username>${SentToDataUsername}</> has been declined.`,
                bShowPlayerIcon: false
            };
            senderClient.ws.send(JSON.stringify(alertMessage));
        }

        const SentToAlertMessage = {
            type: 'alert',
            header: 'Friend Request Declined',
            text: `Successfully declined <Username>${senderUsername}</>'s Friend Request.`,
            bShowPlayerIcon: false
        };
        ws.send(JSON.stringify(SentToAlertMessage));

        await db.declineFriendRequest(AccountIdFrom, AccountIdTo);
    } catch (err) {
        console.error('Error accepting friend request:', err);
    }
}


async function handleRetrieveFriends(ws) {
    const accountId = clients.get(ws).accountId; // Assuming you store accountId in the client data
    const onlinePlayers = getOnlinePlayers(); // Assuming getOnlinePlayers() is defined and returns online players array

    const friendsData = await db.getFriends(accountId, onlinePlayers);

    const responseMessage = {
        type: 'friendslist',
        onlineFriends: friendsData.onlineFriends,
        offlineFriends: friendsData.offlineFriends,
        numOnlineFriends: friendsData.numOnlineFriends,
        numOfflineFriends: friendsData.numOfflineFriends
    };

    ws.send(JSON.stringify(responseMessage));
}

function handleUpdateStatus(ws, message) {
    const clientData = clients.get(ws);
    if (clientData) {
        clientData.status = message.status;
        clients.set(ws, clientData);
    }
}

function handleUpdateCosmeticAvatar(ws, message) {
    const clientData = clients.get(ws);
    if (clientData) {
        clientData.avatar = {
            templateId: message.templateId
        };
        clients.set(ws, clientData);
    }
}

function handleVbucksReward(ws, message) {
    const clientData = clients.get(ws);
    if (clientData) {
        db.getUserDataById(clientData.accountId)
        .then((userData) => {
          if (userData) {
              const newAmount = parseInt(userData.vbucks) + parseInt(message.reward);
    
              db.updateUserDataById(clientData.accountId, { vbucks: newAmount.toString() });
            }
        })
        .catch((err) => {});
    }
}

function handleSetLevelAndXP(ws, message) {
    const clientData = clients.get(ws);
    if (clientData) {
        db.updateProfileAthenaById(clientData.accountId, {statistics: { Level: parseInt(message.level), XP: parseInt(message.xp)}});
    }
}

async function handleRemoveFriend(ws, message) {
    const { AccountIdFrom, AccountIdTo } = message;

    try {
        const senderData = await db.getUserDataById(AccountIdFrom);
        const senderUsername = senderData ? senderData.username : 'Unknown User';

        const SentToAlertMessage = {
            type: 'alert',
            header: 'Friend Removed',
            text: `Successfully removed ${senderUsername} from your friends list.`,
            bShowPlayerIcon: false
        };
        ws.send(JSON.stringify(SentToAlertMessage));

        await db.removeFriend(AccountIdFrom, AccountIdTo);
    } catch (err) {
        console.error('Error accepting friend request:', err);
    }
}

async function BeginMatchmaking(ws, message) {
    // matchmaking checks for the player

    const clientData = clients.get(ws);
    if (clientData) {
        clientData.bInMatchmaking = true;
        clients.set(ws, clientData);

        // if the client cancels matchmaking then clientData.bInMatchmaking will be false, we'll use that to ensure we should continue running this code.

        const playerUserData = await db.getUserDataById(clientData.accountId);
        
        if(playerUserData) {
            if(clientData.bInMatchmaking == false) return;

            if(playerUserData.mcpbandata.length > 0) {
                const currentDate = new Date();
                const hasActiveBan = playerUserData.mcpbandata.some(item => {
                    if (item.unbanDate) {
                        const [day, hour, minute, month, year] = item.unbanDate.split('-').map(Number);
                        const unbanDate = new Date(year, month - 1, day, hour, minute);
                        return unbanDate > currentDate;
                    }
                    return false;
                });

                if(hasActiveBan) {
                    const BanModalMessage = {
                        type: 'banmodal',
                        ban: null, // we'll have to put the ban object from there MCP ban data
                    };
                    ws.send(JSON.stringify(BanModalMessage));
                    return;
                }
            }
        }
        else {

        }
    }
}


console.log('The XMPP server is running and waiting for connections');