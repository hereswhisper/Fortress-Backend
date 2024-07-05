// WebSocket connection to XMPP server
const ws = new WebSocket('ws://localhost:81');

// Handle WebSocket connection open
ws.addEventListener('open', () => {
    console.log('Connected to XMPP server');
    requestPlayerList(); // Request player list after connection
});

// Handle WebSocket messages
ws.addEventListener('message', (event) => {
    console.log('Received message:', event.data); // Log received data
    try {
        const message = JSON.parse(event.data);
        // Handle incoming messages from XMPP server
        if (message.type === 'playerStatusUpdate' || message.type === 'activeplayers') {
            updatePlayerList(message.players);
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});

// Function to send retrieveactiveplayers message to server
function requestPlayerList() {
    const retrieveMessage = {
        type: 'retrieveactiveplayers'
    };
    ws.send(JSON.stringify(retrieveMessage));
}

// Function to update player list in the admin panel
function updatePlayerList(players) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = ''; // Clear previous list

    const activeConnectionsCount = document.getElementById('activeConnectionsCount');
    activeConnectionsCount.textContent = players.length; // Update active connections count

    players.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.classList.add('playerItem');

        const accountIdLabel = document.createElement('span');
        accountIdLabel.textContent = `Account ID: ${player.accountId}`;
        
        const breakLine2 = document.createElement('br'); // Line break before button

        const accountNameLabel = document.createElement('span');
        accountNameLabel.textContent = `Username: ${player.displayName}`;

        const breakLine = document.createElement('br'); // Line break before button
        const killButton = document.createElement('button');
        killButton.className = "killButton";
        killButton.textContent = 'Disconnect';
        killButton.addEventListener('click', () => {
            // Send kill connection action to XMPP server
            const killMessage = {
                type: 'killConnection',
                accountId: player.accountId
            };
            ws.send(JSON.stringify(killMessage));
        });

        playerItem.appendChild(accountIdLabel);
        playerItem.appendChild(breakLine); // Add line break before button
        playerItem.appendChild(accountNameLabel); // Add line break before button
        playerItem.appendChild(breakLine2); // Add line break before button
        playerItem.appendChild(killButton);
        playerList.appendChild(playerItem);
    });
}

// Search functionality
const searchBox = document.getElementById('searchBox');
const searchButton = document.getElementById('searchButton');

searchButton.addEventListener('click', () => {
    const searchTerm = searchBox.value.trim().toLowerCase();
    if (searchTerm === '') {
        return; // Do nothing if search term is empty
    }

    const playerItems = document.querySelectorAll('.playerItem');
    playerItems.forEach(item => {
        const accountId = item.querySelector('span').textContent.toLowerCase();
        if (accountId.includes(searchTerm)) {
            item.style.display = 'block'; // Show item if it matches search term
        } else {
            item.style.display = 'none'; // Hide item if it doesn't match search term
        }
    });
});

// Disconnect All Players button functionality
const disconnectAllButton = document.getElementById('disconnectAllButton');

disconnectAllButton.addEventListener('click', () => {
    const disconnectAllMessage = {
        type: 'disconnectall'
    };
    ws.send(JSON.stringify(disconnectAllMessage));
});
