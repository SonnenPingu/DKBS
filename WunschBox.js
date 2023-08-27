const Discord = require('discord.js');
const axios = require('axios');
const { Readable } = require('stream');

const client = new Discord.Client();
const prefix = '!'; // Das Präfix für Bot-Befehle
const streamURL = 'DEINE_SHOUTCAST_STREAM_URL'; // URL des Shoutcast-Streams
let isCurrentlyOnAir = false;

client.once('ready', () => {
    console.log('Bot ist bereit!');
    checkStreamStatus();
    setInterval(checkStreamStatus, 60000); // Überprüfe alle 60 Sekunden den Stream-Status
});

async function checkStreamStatus() {
    try {
        const response = await axios.get(streamURL, { responseType: 'stream' });
        const stream = response.data.pipe(new Readable());
        let streamData = '';

        stream.on('data', chunk => {
            streamData += chunk.toString();
            if (!isCurrentlyOnAir && streamData.includes('Stream is currently up.')) {
                const startIndexOfDJ = streamData.indexOf('Current Song: </font></td><td><font class=default><b>') + 'Current Song: </font></td><td><font class=default><b>'.length;
                const endIndexOfDJ = streamData.indexOf('</b></font></td></tr>', startIndexOfDJ);
                const djName = streamData.substring(startIndexOfDJ, endIndexOfDJ);

                const channel = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID'); // ID des Discord-Textkanals
                channel.send(`🎙️ OnAir: ${djName}`);
                isCurrentlyOnAir = true;
            } else if (isCurrentlyOnAir && !streamData.includes('Stream is currently up.')) {
                isCurrentlyOnAir = false;
            }
        });
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
            const wunschBoxResponse = await axios.get(`https://deinewordpresswebsite.com/wp-json/wp/v2/posts/${wunschBoxPostID}`);
            const grussBoxResponse = await axios.get(`https://deinewordpresswebsite.com/wp-json/wp/v2/posts/${grussBoxPostID}`);

            const wunschBoxContent = wunschBoxResponse.data.content.rendered;
            const grussBoxContent = grussBoxResponse.data.content.rendered;

            message.channel.send(`Wunsch-Box:\n${wunschBoxContent}\n\nGruß-Box:\n${grussBoxContent}`);
        } catch (error) {
            console.error('Fehler beim Abrufen der WordPress-Inhalte:', error);
            message.channel.send('Es ist ein Fehler aufgetreten.');
        }
    }
});

// Den Bot mit deinem Token anmelden
client.login('DEIN_DISCORD_BOT_TOKEN');
