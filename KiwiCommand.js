// Importiere die asynchronen Funktionen
const {
    extractAndSendScheduleInfo,
    extractAndSaveData,
    fetchHTML,
    pingStreamServer2,
    pingStreamServer1,
    pingHTTPServer,
    isServerOnline,
    checkStreamStatusServer1
} = require('./Function/Async');

// Importiere die synchronen Funktionen
const {
    generateStatusMessage,
    parseTime,
    extractModeratorImageUrl
} = require('./Function/Sync');

// Importiere das CommandoClient und andere ben�tigte Module
const fs = require('fs');
const { Client, Intents, MessageEmbed, WebhookClient } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const { extractAndSaveData, extractAndSendScheduleInfo, pingStreamServer1, pingStreamServer2 } = require('./Function/Async');
const { generateStatusMessage, parseTime, extractModeratorImageUrl } = require('./Function/Sync');
const ntpClient = require('ntp-client');
const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const fs = require('fs');
const onAirRoleId = 'RolleID'; // Aktualisiere mit der gew�nschten Rollen-ID
const streamURLServer1 = 'URL'; // Aktualisiere die URL f�r Server 1
const streamURLServer2 = 'URL'; // Aktualisiere die URL f�r Server 2
const pingInterval = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
const pingIntervalServer2 = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden f�r Server 2
const webhookUrl = 'Webhook'; // Aktualisiere mit deiner Webhook-URL
const sendeplanUrl = 'URL'; // Aktualisiere die URL f�r den Sendeplan
const sendeplanFilePath = 'Sendeplan.json'; // Dateipfad f�r die Sendeplaninformationen
const channelServer1Id = 'CHANNELID'; // Kanal-ID f�r Server 1
const channelServer2Id = 'CHANNELID'; // Kanal-ID f�r Server 2


// Client-Konfiguration
const client = new CommandoClient({
    commandPrefix: '/',
    owner: 'DEINE_BOT_OWNER_ID', // F�ge die ID deines Bot-Besitzers hier ein
});

// Registriere Befehlsgruppen und -dateien aus dem Ordner "commands"
client.registry
    .registerGroups([
        // Hier kannst du Gruppen f�r deine Befehle definieren
        ['ping', 'Pingabruf'],
        ['plan', 'Sendeplan Befehle'],
        ['startextract', 'Sendeplan extract']
        // Weitere Gruppen nach Bedarf hinzuf�gen
    ])
    .registerDefaultTypes()
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands')); // Ordner mit deinen Befehlsdateien

client.once('ready', () => {
    console.log('Bot is ready!');
    checkStreamStatusServer1();
    setInterval(checkStreamStatusServer1, 60000);
    // Intervall f�r das Pingen und Senden von Statusnachrichten f�r Server 1
    setInterval(() => {
        pingStreamServer1(channelServer1Id);
    }, pingInterval);

    // Intervall f�r das Pingen und Senden von Statusnachrichten f�r Server 2
    setInterval(() => {
        pingStreamServer2(channelServer2Id);
    }, pingInterval);

    // Definiere eine Aufgabe, die t�glich um 5 Uhr morgens ausgef�hrt wird
    cron.schedule('0 5 * * *', async () => {
        try {
            // F�hre die Funktion extractAndSaveData() aus, um den Sendeplan abzurufen und zu speichern
            await extractAndSaveData();
            console.log('Sendeplan erfolgreich abgerufen und gespeichert.');

            // F�hre die Funktion extractAndSendScheduleInfo() aus, um den Sendeplan zu verschicken
            // Hier ist die Nachricht m�glicherweise nicht verf�gbar, daher musst du m�glicherweise den Nachrichtenparameter anpassen
            // Sollte es eine spezielle Nachricht oder einen Kanal geben, in dem du den Sendeplan senden m�chtest, passe dies entsprechend an
            // Beispiel: const channel = client.channels.cache.get('CHANNEL_ID');
            // Dann: await extractAndSendScheduleInfo(channel);
            await extractAndSendScheduleInfo(message);
            console.log('Sendeplan erfolgreich verschickt.');
        } catch (error) {
            console.error('Fehler beim geplanten Ausf�hren der Aufgaben:', error);
        }
    });
});

client.login(discord_token);