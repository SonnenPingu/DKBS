const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Discord.Client();
const prefix = '!'; // Das Präfix für Bot-Befehle

client.once('ready', () => {
    console.log('Bot ist bereit!');
});

client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'zeigebox') {
        try {
            const response = await axios.get('DEINE_HTML5_WEBSEITE_URL');
            const $ = cheerio.load(response.data);
            const wunschBoxText = $('.wunsch-box').text(); // Klasse der Wunsch-Box auf deiner Webseite
            const grussBoxText = $('.gruss-box').text(); // Klasse der Gruß-Box auf deiner Webseite

            message.channel.send(`Wunsch-Box: ${wunschBoxText}\nGruß-Box: ${grussBoxText}`);
        } catch (error) {
            console.error('Fehler beim Abrufen der Webseite:', error);
            message.channel.send('Es ist ein Fehler aufgetreten.');
        }
    }
});

// Den Bot mit deinem Token anmelden
client.login('DEIN_DISCORD_BOT_TOKEN');
