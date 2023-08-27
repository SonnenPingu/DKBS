const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Discord.Client();
const prefix = '!'; // Das Präfix für Bot-Befehle
const streamURL = 'DEINE_SHOUTCAST_STREAM_URL'; // URL des Shoutcast-Streams

client.once('ready', () => {
    console.log('Bot ist bereit!');
    checkStreamStatus(); // Überprüfe den Stream-Status, sobald der Bot bereit ist
    setInterval(checkStreamStatus, 60000); // Überprüfe alle 60 Sekunden den Stream-Status
});

async function checkStreamStatus() {
    try {
        const response = await axios.get(streamURL);
        const streamData = response.data;
        const isOnAir = streamData.includes('Stream is currently up.');

        if (isOnAir) {
            const startIndexOfDJ = streamData.indexOf('Current Song: </font></td><td><font class=default><b>') + 'Current Song: </font></td><td><font class=default><b>'.length;
            const endIndexOfDJ = streamData.indexOf('</b></font></td></tr>', startIndexOfDJ);
            const djName = streamData.substring(startIndexOfDJ, endIndexOfDJ);

            const channel = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID'); // ID des Discord-Textkanals
            channel.send(`🎙️ OnAir: ${djName}`);
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Stream-Status:', error);
    }
}

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
