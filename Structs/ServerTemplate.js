function createServerTemplate(serverPort, players, busLaunched, res) {
    return {
        serverPort: serverPort,
        players: players,
        busLaunched: busLaunched
    };
}

module.exports = {
    createServerTemplate
}