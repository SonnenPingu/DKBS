const fs = require('fs');
const { Client, Intents, MessageEmbed, WebhookClient } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const jsdom = require('jsdom');
const ntpClient = require('ntp-client');
let lastPlayedTitle = '';
let lastPlayedArtist = '';
let previousModerator = null; // Speichert den vorherigen Moderator
let previousTime = null; // Speichert die vorherige Uhrzeit

// Lese die Token-Daten aus Token.json
const data = fs.readFileSync('Token.json', 'utf8');
const { discord_token } = JSON.parse(data);

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
});

const prefix = '!'; // Aktualisiere den gewünschten Präfix
const onAirRoleId = 'RolleID'; // Aktualisiere mit der gewünschten Rollen-ID

const streamURLServer1 = 'URL'; // Aktualisiere die URL für Server 1
const streamURLServer2 = 'URL'; // Aktualisiere die URL für Server 2

const pingInterval = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
const pingIntervalServer2 = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden für Server 2
const webhookUrl = 'Webhook'; // Aktualisiere mit deiner Webhook-URL
const sendeplanUrl = 'URL'; // Aktualisiere die URL für den Sendeplan
const sendeplanFilePath = 'Sendeplan.json'; // Dateipfad für die Sendeplaninformationen
const channelServer1Id = 'CHANNELID'; // Kanal-ID für Server 1
const channelServer2Id = 'CHANNELID'; // Kanal-ID für Server 2

//Aufruf Client
client.once('ready', () => {
    console.log('Bot is ready!');
    checkStreamStatusServer1();
    setInterval(checkStreamStatusServer1, 60000);
// Intervall für das Pingen und Senden von Statusnachrichten für Server 1
    setInterval(() => {
    pingStreamServer1(channelServer1Id);
}, pingInterval);

// Intervall für das Pingen und Senden von Statusnachrichten für Server 2
setInterval(() => {
    pingStreamServer2(channelServer2Id);
}, pingInterval);
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
            const channelServer1 = client.channels.cache.get('1145840462826053652'); // Aktualisiere die Kanal-ID für Server 1

            if (!channelServer1) {
                console.error('Kanal für Server 1 nicht gefunden.');
                return;
            }

            const embed = new MessageEmbed()
                .setColor(0x00ff00)
                .setDescription(`🎙️ Live ist **${finalModerator}!**\nGespielt wird *${title}* von *${artist}*.`);

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
async function isServerOnline(serverURL) {
    try {
        const response = await axios.head(serverURL);
        return response.status === 200; // Überprüft, ob der Server mit Statuscode 200 antwortet (OK)
    } catch (error) {
        console.error('Fehler beim Überprüfen des Serverstatus:', error);
        return false; // Der Server wird als offline betrachtet, wenn eine Ausnahme auftritt
    }
}
async function pingHTTPServer(serverURL) {
    try {
        const startTime = Date.now(); // Zeit vor dem Senden der Anfrage

        await axios.get(serverURL);

        const endTime = Date.now(); // Zeit nach dem Empfang der Antwort
        const roundTripTime = endTime - startTime; // Berechnung der Round-Trip-Zeit in Millisekunden

        return roundTripTime;
    } catch (error) {
        console.error('Fehler beim Pingen des HTTP-Servers:', error);
        return -1; // Oder eine andere geeignete Fehlermeldung oder -1, um anzuzeigen, dass das Pingen fehlgeschlagen ist
    }
}
function generateStatusMessage(serverName, onlineStatus, roundTripTime) {
    let color;

    if (onlineStatus) {
        color = '#00ff00'; // Grüner Balken für Online
        onlineStatus = 'Online';
    } else {
        color = '#ff0000'; // Roter Balken für Offline
        onlineStatus = 'Offline';
    }

    // Hier können Sie Ihre Statusnachricht erstellen und zurückgeben
    const embed = new MessageEmbed()
        .setColor(color)
        .setDescription(`**Server: ${serverName}**
Status: ${onlineStatus}
Ping: ${roundTripTime} ms`);

    return { embeds: [embed] };
}

async function pingStreamServer1(channelId) {
    try {
        const roundTripTime = await pingHTTPServer(streamURLServer1); // Round-Trip-Zeit für Server 1 erhalten
        const isServerOnlineResult = await isServerOnline(streamURLServer1);
        console.log('Server 1 Online-Status:', isServerOnlineResult);

        const channelServerStatus = client.channels.cache.get(channelId);

        // Hier eine Statusnachricht generieren, ähnlich wie in checkStreamStatusServer1
        const serverName = 'StreamServer'; // Setzen Sie den Namen Ihres Servers
        const onlineStatus = isServerOnlineResult ? true : false; // Hier wird der Online-Status als boolescher Wert übergeben

        const statusMessage = generateStatusMessage(serverName, onlineStatus, roundTripTime);

        // Nachricht senden
        channelServerStatus.send(statusMessage);

    } catch (error) {
        console.error('Fehler beim Pingen und Aktualisieren des Status auf Server 1:', error);
    }
}

// Funktion pingStreamServer2, die die Funktion pingHTTPServer verwendet und automatisch Nachrichten sendet
async function pingStreamServer2(channelId) {
    try {
        const roundTripTime = await pingHTTPServer(streamURLServer2); // Round-Trip-Zeit für Server 2 erhalten
        const isServerOnlineResult = await isServerOnline(streamURLServer2);
        console.log('Server 2 Online-Status:', isServerOnlineResult);

        const channelServerStatus = client.channels.cache.get(channelId);

        // Hier eine Statusnachricht generieren, ähnlich wie in checkStreamStatusServer1
        const serverName = 'ModServer'; // Setzen Sie den Namen Ihres Servers
        const onlineStatus = isServerOnlineResult ? true : false; // Hier wird der Online-Status als boolescher Wert übergeben

        const statusMessage = generateStatusMessage(serverName, onlineStatus, roundTripTime);

        // Nachricht senden
        channelServerStatus.send(statusMessage);

    } catch (error) {
        console.error('Fehler beim Pingen und Aktualisieren des Status auf Server 2:', error);
    }
}
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Überprüfen, ob die Nachricht mit dem Präfix beginnt
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ping') {
            // Führe die Ping-Funktion für Server 1 aus und sende die Statusnachricht
            const pingMessage = await pingStreamServer1(channelServer1Id); // Hier die Kanal-ID für Server 1 einfügen
            if (pingMessage && pingMessage.content) {
                message.channel.send(pingMessage).then(msg => msg.delete()); // Nachricht senden und sofort löschen
            }

            // Führe die Ping-Funktion für Server 2 aus und sende die Statusnachricht
            const pingMessage2 = await pingStreamServer2(channelServer2Id); // Hier die Kanal-ID für Server 2 einfügen
            if (pingMessage2 && pingMessage2.content) {
                message.channel.send(pingMessage2).then(msg => msg.delete()); // Nachricht senden und sofort löschen
            }

            // Nachricht, die den Befehl !ping enthält, löschen
            message.delete(); // Lösche die ursprüngliche Nachricht
        }
    }
});
// Hilfsfunktion zum Parsen der Uhrzeit und Umwandeln in Minuten seit Mitternacht
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Funktion zur Extrahierung der Sendeplaninformationen und Speicherung in einer Datei
async function extractAndSendScheduleInfo() {
    try {
        // Sendeplaninformationen aus der "PlanDaten.json"-Datei lesen
        const jsonFilePath = 'PlanDaten.json';
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        const sendeplanData = JSON.parse(jsonContent);
    
        // Sendeplaninformationen extrahieren
        const { date, schedule } = sendeplanData;
    
        // Überprüfen, ob Daten vorhanden sind
        if (!date || !schedule || schedule.length === 0) {
            console.error('Ungültige oder leere Sendeplaninformationen.');
            return;
        }
        // Durch jeden Eintrag im Sendeplan iterieren und Nachrichten senden
        for (const entry of schedule) {
            const { time, moderator, description, event } = entry;

            // Nachricht im Discord-Format erstellen
            const embed = new MessageEmbed()
                .setTitle(`(:radio:) Sendeplan ${date} (:radio:)`)
                .addField('Uhrzeit', time)
                .addField('Moderator', moderator)
                .addField('Beschreibung', description)
                .addField('Event', event)
                .setFooter('Powered by DBKS');
        }
            // Discord-Webhook erstellen und Nachricht senden
            const webhookClient = new WebhookClient({ url: webhookUrl });
            await webhookClient.send({ embeds: [embed] });

            console.log('Sendeplan erfolgreich in Discord gepostet');

        // Sendeplaninformationen in "Sendeplan.json" speichern
        const sendeplanFilePath = 'Sendeplan.json';
        let existingSendeplan = [];

        if (fs.existsSync(sendeplanFilePath)) {
            existingSendeplan = JSON.parse(fs.readFileSync(sendeplanFilePath, 'utf8'));
        }

        existingSendeplan.push(sendeplanData);

        fs.writeFileSync(sendeplanFilePath, JSON.stringify(existingSendeplan, null, 2));

    } catch (error) {
        console.error('Fehler beim Abrufen des Sendeplans oder Senden der Nachricht:', error);
    }
}

// Den Bot mit deinem Token anmelden (WICHTIG: Du musst die DATA.json-Datei füllen!)
client.login(discord_token);
