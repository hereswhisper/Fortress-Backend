const { Client, Intents } = require('discord.js');

const client = new Client({ 
    intents: [
        Intents.GUILD_MESSAGES,
        Intents.DIRECT_MESSAGES
    ] 
});

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'hello') {
        await interaction.reply('Hello there!');
    }
});
client.login('MTExNDc4NDM4NDI3NzU2MTQxNA.Gup3-E.odK5Th-cU6KQ21bgZvgYsGXjB0BVyYRrxipoVI');