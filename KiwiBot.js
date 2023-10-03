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

// Definiere eine Aufgabe, die täglich um 5 Uhr morgens ausgeführt wird
cron.schedule('0 5 * * *', async () => {
    try {
        // Führe die Funktion extractAndSaveData() aus, um den Sendeplan abzurufen und zu speichern
        await extractAndSaveData();
        console.log('Sendeplan erfolgreich abgerufen und gespeichert.');

        // Führe die Funktion extractAndSendScheduleInfo() aus, um den Sendeplan zu verschicken
        await extractAndSendScheduleInfo(message); // Stelle sicher, dass "message" korrekt definiert ist
        console.log('Sendeplan erfolgreich verschickt.');
    } catch (error) {
        console.error('Fehler beim geplanten Ausführen der Aufgaben:', error);
    }
});
//Aufruf Client
client.once('ready', () => {
    console.log('Bot is ready!');
    createOnAirButton(channel, onAirRoleId);
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

        // Neuer Befehl !startExtract
        if (command === 'startextract') {
            try {
                await extractAndSaveData();
                message.channel.send('Datenextraktion erfolgreich abgeschlossen und gespeichert.');
            } catch (error) {
                console.error('Fehler beim manuellen Starten der Datenextraktion:', error);
                message.channel.send('Fehler beim manuellen Starten der Datenextraktion.');
            }
        }

        // Überprüfe, ob die Nachricht den Befehl "!plan" enthält
        if (command === 'plan') {
            try {
                // Rufe die Funktion extractAndSendScheduleInfo() auf
                await extractAndSendScheduleInfo(message);
                message.channel.send('Befehl "!plan" wurde ausgeführt.');
            } catch (error) {
                console.error('Fehler beim Ausführen des Befehls "!plan":', error);
                message.channel.send('Fehler beim Ausführen des Befehls "!plan".');
            }
        }
        // Füge hier deine anderen Befehle und Logik hinzu
        // ...
    }
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
            
            // Fallback-Titel und Interpret, wenn keine gefunden werden
            artist = 'Kiwi Sound';
            title = 'Der böse';
            
            // Fallback für Moderator, wenn kein Moderator nach dem | gefunden wird
            if (text.includes('<a href="currentsong?sid=1">')) {
                finalModerator = text.split('<a href="currentsong?sid=1">')[1].split('</a>')[0];
            }
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
//Funktion zum Parsen der Uhrzeit und Umwandeln in Minuten seit Mitternacht
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}
// Funktion zum Extrahieren der Bild-URL für den Moderator
function extractModeratorImageUrl(htmlData, moderatorName) {
    const $ = cheerio.load(htmlData);
    const imgTags = $('img.img-responsive');

    for (let i = 0; i < imgTags.length; i++) {
        const imgTag = $(imgTags[i]);
        const src = imgTag.attr('src');
        const normalizedModeratorName = moderatorName
            .replace(/[ö]/g, 'oe')
            .replace(/[ü]/g, 'ue')
            .replace(/[ä]/g, 'ae')
            .toLowerCase();

        if (src && src.toLowerCase().includes(normalizedModeratorName)) {
            return src;
        }
    }

    // Wenn kein Bild gefunden wurde, gib einen Standard-URL zurück
    return 'https://mystic-celduin.de/wp-content/uploads/2023/10/WhatsApp-Bild-2023-08-31-um-21.10.02.jpg';
}
// Funktion zum Abrufen der HTML-Daten
async function fetchHTML() {
    try {
        const response = await axios.get(sendeplanUrl);
        return response.data;
    } catch (error) {
        console.error('Fehler beim Abrufen der HTML-Daten:', error);
        throw error;
    }
}
// Hauptfunktion zum Extrahieren und Speichern der Daten
async function extractAndSaveData() {
    try {
        console.log('Die extractAndSaveData() - Funktion wird aufgerufen.');

        // Hier startet der try-Block
        const htmlData = await fetchHTML();
        console.log('HTML-Daten erfolgreich abgerufen.');

        const $ = cheerio.load(htmlData);

        // Erstelle ein leeres Array, um die Daten zu speichern
        const sendeplan = [];

        // Durchlaufe die Tabellenzeilen und extrahiere die Informationen
        $('tbody tr').each((index, element) => {
            const row = $(element);

            // Extrahiere die Zeit
            const zeit = row.find('td:nth-child(1)').text().trim();

            // Extrahiere die Beschreibung
            const beschreibung = row.find('td:nth-child(2) a').text().trim();

            // Extrahiere den Moderator
            const moderator = row.find('td:nth-child(3)').text().trim();

            // Überprüfe, ob es sich um ein Event handelt
            const istEvent = row.hasClass('table-success');

            // Füge die Daten dem sendeplan-Array hinzu
            sendeplan.push({
                zeit,
                beschreibung,
                moderator,
                istEvent,
            });
        });

        console.log('Daten erfolgreich extrahiert und in das sendeplan-Array eingefügt.');
        console.log('Daten erfolgreich extrahiert und verarbeitet.');

        // Speichere die Daten in einer JSON-Datei
        fs.writeFileSync('PlanDaten.json', JSON.stringify(sendeplan, null, 2));

        console.log('Daten erfolgreich in PlanDaten.json gespeichert.');
    } catch (error) {
        // Hier wird ein Fehler abgefangen, wenn er im try-Block auftritt
        console.error('Fehler beim Extrahieren und Speichern der Daten:', error);
    }
}

async function extractAndSendScheduleInfo(message, schedule) {
    try {
        // Pfad zur JSON-Datei festlegen
        const jsonFilePath = 'PlanDaten.json';

        // Überprüfen, ob die JSON-Datei existiert
        if (!fs.existsSync(jsonFilePath)) {
            console.error('Die JSON-Datei existiert nicht.');
            message.channel.send('Die JSON-Datei existiert nicht.');
            return;
        }

        // JSON-Datei lesen und Daten parsen
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        const sendeplanData = JSON.parse(jsonContent);

        // Überprüfen, ob die Sendeplaninformationen vorhanden und nicht leer sind
        if (!sendeplanData || !Array.isArray(sendeplanData) || sendeplanData.length === 0) {
            console.error('Ungültige oder leere Sendeplaninformationen.');
            message.channel.send('Ungültige oder leere Sendeplaninformationen.');
            return;
        }

        // Pfad zur HTML-Datei festlegen
        const htmlFilePath = 'mod.html';

        // HTML-Datei lesen und Inhalt in htmlData speichern
        const htmlData = fs.readFileSync(htmlFilePath, 'utf8');

//Durch jeden Eintrag im Sendeplan iterieren und nur gültige Einträge senden
for (const entry of sendeplanData) {
    if (entry.zeit && entry.beschreibung && entry.moderator) {
        const { zeit, beschreibung, moderator, istEvent } = entry;

        // Mod-Namen aus den Sendeplandaten und HTML in Kleinbuchstaben konvertieren
        const modNameInSendeplan = moderator.toLowerCase();
        const modNameInHtml = moderator.toLowerCase();
        
        // Überprüfen, ob der erste Buchstabe des Mod-Namens in Kleinbuchstaben ist
        const isFirstLetterLowerCase = modNameInHtml[0] === modNameInHtml[0].toLowerCase();

        // Falls der erste Buchstabe in Kleinbuchstaben ist, konvertiere ihn in Großbuchstaben
        const modNameInMessage = isFirstLetterLowerCase
            ? modNameInHtml.charAt(0).toUpperCase() + modNameInHtml.slice(1)
            : modNameInHtml;

        if (modNameInSendeplan === modNameInHtml) {
            // Wenn sie übereinstimmen, extrahiere die Bild-URL
            const moderatorImageUrl = extractModeratorImageUrl(htmlData, modNameInSendeplan);

            const embed = new MessageEmbed()
                .setTitle(`:radio: Sendeplan ${formattedDate} :radio:`)
                .addFields(
                    { name: 'Uhrzeit', value: zeit },
                    { name: 'Moderator', value: modNameInMessage, inline: true }, // Hier den Mod-Namen in der Nachricht mit einem Großbuchstaben beginnend
                    { name: 'Beschreibung', value: beschreibung },
                    { name: 'Event', value: istEvent ? 'Ja' : 'Nein' }
                )
                .setImage(moderatorImageUrl)
                .setFooter({ text: 'Powered by DBKS' });

            if (istEvent) {
                embed.setColor('#00FF00');
            }

            const webhookClient = new WebhookClient({ url: webhookUrl });
            await webhookClient.send({ embeds: [embed] });

            console.log(`Sendeplan erfolgreich in Discord gepostet für Zeit: ${zeit}`);
        }
    }
}
console.log('Sendeplaninformationen wurden erfolgreich verarbeitet.');

    } catch (error) {
        console.error('Fehler beim Abrufen des Sendeplans oder Senden der Nachricht:', error);
    }
}
// Funktion zum Überprüfen und Aktualisieren der OnAir-Rolle
async function toggleOnAirRole(user, channel, onAirRoleId) {
    if (!user.bot) {
        const member = channel.guild.members.cache.get(user.id);
        if (member.roles.cache.has(onAirRoleId)) {
            // Benutzer hat bereits die "OnAir"-Rolle, entferne sie
            await member.roles.remove(onAirRoleId);
        } else {
            // Benutzer hat die "OnAir"-Rolle nicht, füge sie hinzu
            await member.roles.add(onAirRoleId);
        }
    }
}

// Erstelle die "OnAir"-Schaltfläche
async function createOnAirButton(channel, onAirRoleId) {
    const onAirMessage = await channel.send('Klicke auf das Symbol für die "OnAir" Anzeige! 🎙️');
    await onAirMessage.react('🎙️');

    const filter = (reaction, user) => reaction.emoji.name === '🎙️' && !user.bot;
    const collector = onAirMessage.createReactionCollector({ filter, time: 60000 });

    collector.on('collect', async (reaction, user) => {
        await toggleOnAirRole(user, channel, onAirRoleId);
        await reaction.users.remove(user.id);
    });
}
// Den Bot mit deinem Token anmelden (WICHTIG: Du musst die DATA.json-Datei füllen!)
client.login(discord_token);
