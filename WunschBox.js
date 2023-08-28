const Discord = require('discord.js');
const axios = require('axios');
const { Readable } = require('stream');

const client = new Discord.Client();
const prefix = '!'; // Das Präfix für Bot-Befehle
const streamURLServer1 = 'DEINE_SHOUTCAST_STREAM_URL_SERVER1'; // URL des Shoutcast-Streams für Server 1 (mit DJ/Musik-Abfrage)
const streamURLServer2 = 'DEINE_SHOUTCAST_STREAM_URL_SERVER2'; // URL des Shoutcast-Streams für Server 2 (nur Online-Status)
const streamURLServer3 = 'DEINE_SHOUTCAST_STREAM_URL_SERVER3'; // URL des Shoutcast-Streams für Server 3 (nur Online-Status)
let previousDJServer1 = null;
let previousServer2Status = false;
let previousServer3Status = false;

const onAirRoleId = 'ROLLEN_ID_ONAIR'; // ID der Rolle für "OnAir"

client.once('ready', () => {
    console.log('Bot ist bereit!');
    checkStreamStatus();
    setInterval(checkStreamStatus, 60000); // Überprüfe alle 60 Sekunden den Stream-Status
});

async function checkStreamStatus() {
    try {
        // Überprüfe Server 1 (mit DJ/Musik-Abfrage)
        const responseServer1 = await axios.get(streamURLServer1, { responseType: 'stream' });
        const streamServer1 = responseServer1.data.pipe(new Readable());
        let streamDataServer1 = '';

        streamServer1.on('data', chunk => {
            streamDataServer1 += chunk.toString();
            const currentDJIndexServer1 = streamDataServer1.indexOf('Current Song: </font></td><td><font class=default><b>');
            
            if (currentDJIndexServer1 !== -1) {
                const startIndexOfDJServer1 = currentDJIndexServer1 + 'Current Song: </font></td><td><font class=default><b>'.length;
                const endIndexOfDJServer1 = streamDataServer1.indexOf('</b></font></td></tr>', startIndexOfDJServer1);
                const djAndMusicTitleServer1 = streamDataServer1.substring(startIndexOfDJServer1, endIndexOfDJServer1);

                const djNameIndex = djAndMusicTitleServer1.indexOf('|') + 1; // Such nach dem "|", um den DJ-Namen zu extrahieren
                const djName = djAndMusicTitleServer1.substring(djNameIndex).trim();
                const musicTitleIndex = djAndMusicTitleServer1.indexOf('|') - 1; // Such vor dem "|" nach dem Musiktitel
                const musicTitle = djAndMusicTitleServer1.substring(0, musicTitleIndex).trim();

                if (previousDJServer1 !== djAndMusicTitleServer1) {
                    previousDJServer1 = djAndMusicTitleServer1;
                    const channelServer1 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER1'); // ID des Discord-Textkanals für Server 1
                    const embed = new Discord.MessageEmbed()
                        .setColor(0x00ff00)
                        .setDescription(`🎙️ ${djName} ist live für euch on Air 🎙️\n\nMusiktitel: ${musicTitle}`);
                    channelServer1.send(embed);
                }
            }
        });

        // Überprüfe Server 2 (nur Online-Status)
        const responseServer2 = await axios.get(streamURLServer2).catch(error => {
            if (previousServer2Status !== false) {
                previousServer2Status = false;
                const channelServer2 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER2'); // ID des Discord-Textkanals für Server 2
                const statusServer2 = generateStatusMessage('Server 2', null, null, null, false);
                channelServer2.send(statusServer2);
            }
        });

        if (responseServer2 && responseServer2.status === 200) {
            if (previousServer2Status !== true) {
                previousServer2Status = true;
                const channelServer2 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER2'); // ID des Discord-Textkanals für Server 2
                const statusServer2 = generateStatusMessage('Server 2', null, null, null, true);
                channelServer2.send(statusServer2);
            }
        }

        // Überprüfe Server 3 (nur Online-Status)
        const responseServer3 = await axios.get(streamURLServer3).catch(error => {
            if (previousServer3Status !== false) {
                previousServer3Status = false;
                const channelServer3 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER3'); // ID des Discord-Textkanals für Server 3
                const statusServer3 = generateStatusMessage('Server 3', null, null, null, false);
                channelServer3.send(statusServer3);
            }
        });

        if (responseServer3 && responseServer3.status === 200) {
            if (previousServer3Status !== true) {
                previousServer3Status = true;
                const channelServer3 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER3'); // ID des Discord-Textkanals für Server 3
                const statusServer3 = generateStatusMessage('Server 3', null, null, null, true);
                channelServer3.send(statusServer3);
            }
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Stream-Status:', error);
    }
}

function generateStatusMessage(serverName, djAndMusicTitle, time, ping, isOnline) {
    let statusMessage = `**${serverName} `;
    
    if (isOnline !== null) {
        statusMessage += isOnline ? 'ist online.**' : 'ist offline.**';
    } else {
        statusMessage += 'ist online.**\n';
        statusMessage += `DJ/Musik: ${djAndMusicTitle}\n`;
        statusMessage += `Time: ${time}\n`;
        statusMessage += `Ping: ${ping}`;
    }

    return statusMessage;
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

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.emoji.name === '🎙️') {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.add(onAirRoleId);
            } catch (error) {
                console.error('Fehler beim Hinzufügen der Rolle:', error);
            }
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.emoji.name === '🎙️') {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.remove(onAirRoleId);
            } catch (error) {
                console.error('Fehler beim Entfernen der Rolle:', error);
            }
        }
    }
});

// Den Bot mit deinem Token anmelden
client.login('DEIN_DISCORD_BOT_TOKEN');
const Discord = require('discord.js');
const axios = require('axios');
const { Readable } = require('stream');

const client = new Discord.Client();
const prefix = '!'; // Das Präfix für Bot-Befehle
const streamURLServer1 = 'DEINE_SHOUTCAST_STREAM_URL_SERVER1'; // URL des Shoutcast-Streams für Server 1 (mit DJ/Musik-Abfrage)
const streamURLServer2 = 'DEINE_SHOUTCAST_STREAM_URL_SERVER2'; // URL des Shoutcast-Streams für Server 2 (nur Online-Status)
const streamURLServer3 = 'DEINE_SHOUTCAST_STREAM_URL_SERVER3'; // URL des Shoutcast-Streams für Server 3 (nur Online-Status)
let previousDJServer1 = null;
let previousServer2Status = false;
let previousServer3Status = false;

const onAirRoleId = 'ROLLEN_ID_ONAIR'; // ID der Rolle für "OnAir"

client.once('ready', () => {
    console.log('Bot ist bereit!');
    checkStreamStatus();
    setInterval(checkStreamStatus, 60000); // Überprüfe alle 60 Sekunden den Stream-Status
});

async function checkStreamStatus() {
    try {
        // Überprüfe Server 1 (mit DJ/Musik-Abfrage)
        const responseServer1 = await axios.get(streamURLServer1, { responseType: 'stream' });
        const streamServer1 = responseServer1.data.pipe(new Readable());
        let streamDataServer1 = '';

        streamServer1.on('data', chunk => {
            streamDataServer1 += chunk.toString();
            const currentDJIndexServer1 = streamDataServer1.indexOf('Current Song: </font></td><td><font class=default><b>');
            
            if (currentDJIndexServer1 !== -1) {
                const startIndexOfDJServer1 = currentDJIndexServer1 + 'Current Song: </font></td><td><font class=default><b>'.length;
                const endIndexOfDJServer1 = streamDataServer1.indexOf('</b></font></td></tr>', startIndexOfDJServer1);
                const djAndMusicTitleServer1 = streamDataServer1.substring(startIndexOfDJServer1, endIndexOfDJServer1);

                const djNameIndex = djAndMusicTitleServer1.indexOf('|') + 1; // Such nach dem "|", um den DJ-Namen zu extrahieren
                const djName = djAndMusicTitleServer1.substring(djNameIndex).trim();
                const musicTitleIndex = djAndMusicTitleServer1.indexOf('|') - 1; // Such vor dem "|" nach dem Musiktitel
                const musicTitle = djAndMusicTitleServer1.substring(0, musicTitleIndex).trim();

                if (previousDJServer1 !== djAndMusicTitleServer1) {
                    previousDJServer1 = djAndMusicTitleServer1;
                    const channelServer1 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER1'); // ID des Discord-Textkanals für Server 1
                    const embed = new Discord.MessageEmbed()
                        .setColor(0x00ff00)
                        .setDescription(`🎙️ ${djName} ist live für euch on Air 🎙️\n\nMusiktitel: ${musicTitle}`);
                    channelServer1.send(embed);
                }
            }
        });

        // Überprüfe Server 2 (nur Online-Status)
        const responseServer2 = await axios.get(streamURLServer2).catch(error => {
            if (previousServer2Status !== false) {
                previousServer2Status = false;
                const channelServer2 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER2'); // ID des Discord-Textkanals für Server 2
                const statusServer2 = generateStatusMessage('Server 2', null, null, null, false);
                channelServer2.send(statusServer2);
            }
        });

        if (responseServer2 && responseServer2.status === 200) {
            if (previousServer2Status !== true) {
                previousServer2Status = true;
                const channelServer2 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER2'); // ID des Discord-Textkanals für Server 2
                const statusServer2 = generateStatusMessage('Server 2', null, null, null, true);
                channelServer2.send(statusServer2);
            }
        }

        // Überprüfe Server 3 (nur Online-Status)
        const responseServer3 = await axios.get(streamURLServer3).catch(error => {
            if (previousServer3Status !== false) {
                previousServer3Status = false;
                const channelServer3 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER3'); // ID des Discord-Textkanals für Server 3
                const statusServer3 = generateStatusMessage('Server 3', null, null, null, false);
                channelServer3.send(statusServer3);
            }
        });

        if (responseServer3 && responseServer3.status === 200) {
            if (previousServer3Status !== true) {
                previousServer3Status = true;
                const channelServer3 = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID_SERVER3'); // ID des Discord-Textkanals für Server 3
                const statusServer3 = generateStatusMessage('Server 3', null, null, null, true);
                channelServer3.send(statusServer3);
            }
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Stream-Status:', error);
    }
}

function generateStatusMessage(serverName, djAndMusicTitle, time, ping, isOnline) {
    let statusMessage = `**${serverName} `;
    
    if (isOnline !== null) {
        statusMessage += isOnline ? 'ist online.**' : 'ist offline.**';
    } else {
        statusMessage += 'ist online.**\n';
        statusMessage += `DJ/Musik: ${djAndMusicTitle}\n`;
        statusMessage += `Time: ${time}\n`;
        statusMessage += `Ping: ${ping}`;
    }

    return statusMessage;
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

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.emoji.name === '🎙️') {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.add(onAirRoleId);
            } catch (error) {
                console.error('Fehler beim Hinzufügen der Rolle:', error);
            }
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.emoji.name === '🎙️') {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.remove(onAirRoleId);
            } catch (error) {
                console.error('Fehler beim Entfernen der Rolle:', error);
            }
        }
    }
});

// Den Bot mit deinem Token anmelden
client.login('DEIN_DISCORD_BOT_TOKEN');
//
//
//Bitte ersetze die Platzhalter wie DEIN_SHOUTCAST_STREAM_URL_SERVER1, DEIN_SHOUTCAST_STREAM_URL_SERVER2, DEIN_SHOUTCAST_STREAM_URL_SERVER3, DEINE_DISCORD_CHANNEL_ID_SERVER1, DEINE_DISCORD_CHANNEL_ID_SERVER2, DEINE_DISCORD_CHANNEL_ID_SERVER3, ROLLEN_ID_ONAIR, DEIN_DISCORD_BOT_TOKEN, wunschBoxPostID und grussBoxPostID entsprechend mit den richtigen Werten. Dieser Code sollte die gewünschten Funktionen in deinem Discord-Bot implementieren. 
//
