const fs = require('fs');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const axios = require('axios');
const http = require('http');
const cheerio = require('cheerio');
let lastPlayedTitle = '';
let lastPlayedArtist = '';

// Lese die Token-Daten aus DATA.json
const data = fs.readFileSync('DATA.json', 'utf8');
const { discord_token } = JSON.parse(data);

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

const prefix = '!';
const streamURLServer1 = 'URL'; // Aktualisiere die URL
const streamURLServer2 = 'URL'; // Aktualisiere die URL
const pingInterval = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
const pingIntervalServer2 = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden für Server 2
const onAirRoleId = 'ROLLENID';

client.once('ready', () => {
    console.log('Bot is ready!');
    createOnAirButton();
    checkStreamStatusServer1();
    setInterval(checkStreamStatusServer1, 120000);
    setInterval(pingStreamServer2, pingIntervalServer2); // Alle 24 Stunden Server 2 anpingen
    setInterval(pingStreamServer1, pingInterval); // Alle 24 Stunden Server 1 anpingen
});

// Funktionen für Server 1

async function checkStreamStatusServer1() {
    try {
        // Holen der HTML-Seite von Server 1
        const responseServer1 = await axios.get(streamURLServer1);

        if (!responseServer1 || !responseServer1.data) {
            console.error('Keine Daten von Server 1 erhalten oder ungültige Antwort.');
            return;
        }

        // Extrahieren der Informationen aus dem HTML mit dem angegebenen CSS-Pfad
        const server1Data = responseServer1.data;

        // Hier verwenden wir cheerio, um den Moderator, Interpreten und Titel zu extrahieren
        const $ = cheerio.load(server1Data);
        const anchorElement = $('body > table:nth-child(4) > tbody > tr:nth-child(8) > td:nth-child(2) > b > a');  
//WICHTIG IHR Müsst den PFAD an eure Gegegnheiten anpassen!
        const text = anchorElement.text().trim();

        // Überprüfung auf leere Werte
        if (!text) {
            console.error('Ungültige Werte für Nachricht auf Server 1.');
            return;
        }

        // Extrahieren von Moderator, Interpret und Titel
        let finalModerator = 'DBKS'; // Standardwert, falls der Trennstrich "|" nicht gefunden wird
        let artist = '';
        let title = '';

        if (text.includes('|')) {
            const [titleAndArtist, moderator] = text.split(' | ');
            [artist, title] = titleAndArtist.split(' - ');
            if (moderator) {
                finalModerator = moderator;
            }
        } else {
            [artist, title] = text.split(' - ');
        }
 // Überprüfen, ob Interpret und Titel vorhanden sind
        if (!artist || !title) {
            console.error('Ungültige Werte für Nachricht auf Server 1.');
            return;
        }

        // Überprüfen, ob sich die Informationen geändert haben
        if (lastPlayedTitle !== title || lastPlayedArtist !== artist) {
            // Hier kannst du die gewonnenen Informationen verwenden
            console.log('Moderator auf Server 1:', finalModerator);
            console.log('Interpret auf Server 1:', artist);
            console.log('Titel auf Server 1:', title);

            // Erstelle ein Embed oder sende eine Nachricht mit den Informationen
            const channelServer1 = client.channels.cache.get('ChannelID'); // Aktualisiere die Kanal-ID für Server 1

            if (!channelServer1) {
                console.error('Kanal für Server 1 nicht gefunden.');
                return;
            }

            const embed = new MessageEmbed()
                .setColor(0x00ff00)
                .setDescription(`🎙️ Live ist ${finalModerator}\nGespielt wird ${title} von ${artist}`);

            if (!embed.description) {
                console.error('Embed-Beschreibung ist leer.');
                return;
            }

            channelServer1.send({ embeds: [embed] });

            // Aktualisiere die zuletzt gespielten Informationen
            lastPlayedTitle = title;
            lastPlayedArtist = artist;
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Stream-Status auf Server 1:', error);
    }
}
async function pingStreamServer1() {
    try {
        // Hier Server 1 anpingen und den Status aktualisieren
        const isServerOnline = await isServerOnline(streamURLServer1); // Verwenden Sie Ihre eigene Logik hier, um den Server-Status zu überprüfen

        const channelServerStatus = client.channels.cache.get('ChannelID'); // Aktualisiere die Channel-ID für Server 1
        const statusMessage = generateStatusMessage('Server 1', null, null, null, isServerOnline);
        channelServerStatus.send(statusMessage);
    } catch (error) {
        console.error('Fehler beim Pingen und Aktualisieren des Status auf Server 1:', error);
    }
}

// Funktionen für Server 2

async function pingStreamServer2() {
    try {
        // Hier Server 2 anpingen und den Status aktualisieren
        const isServerOnline = await isServerOnline(streamURLServer2); // Verwenden Sie Ihre eigene Logik hier, um den Server-Status zu überprüfen

        const channelServer2 = client.channels.cache.get('ChannelID); // Aktualisiere die Kanal-ID für Server 2
        const statusMessage = generateStatusMessage('Server 2', null, null, null, isServerOnline);
        channelServer2.send(statusMessage);
    } catch (error) {
        console.error('Fehler beim Pingen und Aktualisieren des Status auf Server 2:', error);
    }
}

async function isServerOnline(url) {
    try {
        const response = await axios.get(url);
        return response.status === 200; // Der Server ist online, wenn der Statuscode 200 (OK) ist
    } catch (error) {
        console.error('Fehler beim Überprüfen des Serverstatus:', error);
        return false; // Der Server ist offline oder es gab einen Fehler bei der Anfrage
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
client.once('ready', async () => {
    const onAirRoleId = '1145837851309777029'; // Deine "OnAir"-Rollen-ID hier

    const channel = client.channels.cache.get('1145840486725193801'); // Ersetze 'DEIN_CHANNEL_ID' durch die ID des Textkanals, in den die Nachricht gesendet werden soll

    if (!channel) {
        console.error('Der Textkanal wurde nicht gefunden.');
        return;
    }

    const onAirMessage = await channel.send('Klicke auf das Symbol für die "OnAir" Anzeige! 🎙️');

    // Füge das Mikrofon-Emoji als Reaktion hinzu
    await onAirMessage.react('🎙️');

    // Erstelle einen Reaktionsfilter, der nur auf das Mikrofon-Emoji reagiert
    const filter = (reaction, user) => reaction.emoji.name === '🎙️' && !user.bot;

    // Erstelle einen Reaktionskollektor, der auf Reaktionen auf diese Nachricht reagiert
    const collector = onAirMessage.createReactionCollector({ filter, time: 60000 }); // Reagiere für 60 Sekunden

    collector.on('collect', async (reaction, user) => {
        // Überprüfe, ob der Benutzer bereits die "OnAir"-Rolle hat
        if (user) {
            if (channel.guild.members.cache.get(user.id).roles.cache.has(onAirRoleId)) {
                // Benutzer hat bereits die "OnAir"-Rolle, entferne sie
                await channel.guild.members.cache.get(user.id).roles.remove(onAirRoleId);
            } else {
                // Benutzer hat die "OnAir"-Rolle nicht, füge sie hinzu
                await channel.guild.members.cache.get(user.id).roles.add(onAirRoleId);
            }

            // Entferne die Reaktion des Benutzers, um die Schaltfläche zurückzusetzen
            await reaction.users.remove(user.id);
        }
    });

    // Überwache das Ende des Kollektors
    collector.on('end', () => {
        // Entferne die Reaktionen und Nachricht, wenn der Kollektor endet
        onAirMessage.reactions.removeAll();
    });
});

// Den Bot mit deinem Token anmelden WICHTIG DU MUSST DIE DATA.json füllen!
client.login(discord_token);
