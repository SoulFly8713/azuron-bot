const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();

app.get("/", (req, res) => {
    res.send("Bot aktif 🚀");
});

app.listen(process.env.PORT || 3000, () => {});

process.on('unhandledRejection', error => {});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName('merhaba')
            .setDescription('Bota merhaba dedirtir.')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {}
    
    console.log(`Bot basariyla aktif oldu: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'merhaba') {
        await interaction.reply({ content: 'Merhaba!' });
    }
});

client.login(process.env.TOKEN)
    .then(() => {
        console.log("Token dogru.");
    })
    .catch(err => {
        console.error("Hata:", err);
    });
