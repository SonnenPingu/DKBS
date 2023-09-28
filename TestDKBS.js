const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const axios = require('axios');
const { Readable } = require('stream');
const http = require('http');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

const prefix = '!';
const streamURLServer1 = 'http://89.163.216.178:8000/index.html?sid=1';
const streamURLServer2 = 'http://62.141.46.92/';
let previousDJServer1 = null;
let previousServer2Status = false;
const onAirRoleId = '1145837851309777029';

client.once('ready', () => {
    console.log('Bot is ready!');
    createOnAirButton();
    checkStreamStatus();
    setInterval(checkStreamStatus, 60000);
});

async function checkStreamStatus() {
    try {
        // Überprüfe Server 1 (mit DJ/Musik-Abfrage)
        const responseServer1 = await fetchDataFromServer(streamURLServer1);

        const streamServer1 = responseServer1.data.pipe(new Readable());
        let streamDataServer1 = '';

        streamServer1.on('data', chunk => {
            streamDataServer1 += chunk.toString();
            const currentDJIndexServer1 = streamDataServer1.indexOf('Current Song: </font></td><td><font class=default><b>');

            if (currentDJIndexServer1 !== -1) {
                const startIndexOfDJServer1 = currentDJIndexServer1 + 'Current Song: </font></td><td><font class=default><b>'.length;
                const endIndexOfDJServer1 = streamDataServer1.indexOf('</b></font></td></tr>', startIndexOfDJServer1);
                const djAndMusicTitleServer1 = streamDataServer1.substring(startIndexOfDJServer1, endIndexOfDJServer1);

                const djNameIndex = djAndMusicTitleServer1.indexOf('|') + 1;
                const djName = djAndMusicTitleServer1.substring(djNameIndex).trim();
                const musicTitleIndex = djAndMusicTitleServer1.indexOf('|') - 1;
                const musicTitle = djAndMusicTitleServer1.substring(0, musicTitleIndex).trim();

                if (previousDJServer1 !== djAndMusicTitleServer1) {
                    previousDJServer1 = djAndMusicTitleServer1;
                    const channelServer1 = client.channels.cache.get('1145840462826053652');
                    const embed = new Discord.MessageEmbed()
                        .setColor(0x00ff00)
                        .setDescription(`🎙️ ${djName} ist live für euch on Air 🎙️\n\nMusiktitel: ${musicTitle}`);
                    channelServer1.send(embed);
                }
            }
        });

        // Überprüfe Server 2 (mit DJ/Musik-Abfrage)
        const responseServer2 = await fetchDataFromServer(streamURLServer2);

        // Überprüfe Server 2 (nur Online-Status)
        if (previousServer2Status !== false) {
            previousServer2Status = false;
            const channelServer2 = client.channels.cache.get('1145842497860423700');
            const statusServer2 = generateStatusMessage('Server 2', null, null, null, false);
            channelServer2.send(statusServer2);
        }

        if (responseServer2 && responseServer2.status === 200) {
            if (previousServer2Status !== true) {
                previousServer2Status = true;
                const channelServer2 = client.channels.cache.get('1145842497860423700');
                const statusServer2 = generateStatusMessage('Server 2', null, null, null, true);
                channelServer2.send(statusServer2);
            }
        }

    } catch (error) {
        console.error('Fehler beim Überprüfen des Stream-Status:', error);
    }
}

function fetchDataFromServer(url) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: {
                'User-Agent': 'DKBS'
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
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

    // Hier kannst du deine Befehlsverarbeitung hinzufügen, wenn benötigt
});

function createOnAirButton() {
    const channel = client.channels.cache.get('1145840486725193801');

    const onAirButton = new MessageButton()
        .setCustomId('on_air_button')
        .setLabel('OnAir')
        .setStyle('PRIMARY');

    const row = new MessageActionRow().addComponents(onAirButton);

    channel.send({ content: 'Klicke auf den Button, um "OnAir" zu gehen:', components: [row] });
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'on_air_button') {
        const member = interaction.member;
        const isOnAir = member.roles.cache.has(onAirRoleId);

        const confirmationMessage = await interaction.reply({
            content: isOnAir ? 'Bist du sicher, dass du nicht mehr "OnAir" sein möchtest?' : 'Bist du sicher, dass du "OnAir" gehen möchtest?',
            fetchReply: true
        });

        await confirmationMessage.react('✅');
        await confirmationMessage.react('❌');

        const filter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === interaction.user.id;
        const collector = confirmationMessage.createReactionCollector({ filter, time: 30000 });

        collector.on('collect', async reaction => {
            if (reaction.emoji.name === '✅') {
                collector.stop();

                if (isOnAir) {
                    await member.roles.remove(onAirRoleId);
                    await interaction.followUp({ content: 'Du bist nicht mehr "OnAir".', ephemeral: true });
                } else {
                    await member.roles.add(onAirRoleId);
                    await interaction.followUp({ content: 'Du bist jetzt "OnAir".', ephemeral: true });
                }
            } else if (reaction.emoji.name === '❌') {
                collector.stop();
                await interaction.followUp({ content: 'Aktion abgebrochen.', ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Du hast nicht rechtzeitig reagiert. Aktion abgebrochen.', ephemeral: true });
            }
        });
    }
});

// Den Bot mit deinem Token anmelden
client.login('TOKEN');
