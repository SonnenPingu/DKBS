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

// Importiere das CommandoClient und andere benötigte Module
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


// Client-Konfiguration
const client = new CommandoClient({
    commandPrefix: '/',
    owner: 'DEINE_BOT_OWNER_ID', // Füge die ID deines Bot-Besitzers hier ein
});

// Registriere Befehlsgruppen und -dateien aus dem Ordner "commands"
client.registry
    .registerGroups([
        // Hier kannst du Gruppen für deine Befehle definieren
        ['ping', 'Pingabruf'],
        ['plan', 'Sendeplan Befehle'],
        ['startextract', 'Sendeplan extract']
        // Weitere Gruppen nach Bedarf hinzufügen
    ])
    .registerDefaultTypes()
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands')); // Ordner mit deinen Befehlsdateien

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

    // Definiere eine Aufgabe, die täglich um 5 Uhr morgens ausgeführt wird
    cron.schedule('0 5 * * *', async () => {
        try {
            // Führe die Funktion extractAndSaveData() aus, um den Sendeplan abzurufen und zu speichern
            await extractAndSaveData();
            console.log('Sendeplan erfolgreich abgerufen und gespeichert.');

            // Führe die Funktion extractAndSendScheduleInfo() aus, um den Sendeplan zu verschicken
            // Hier ist die Nachricht möglicherweise nicht verfügbar, daher musst du möglicherweise den Nachrichtenparameter anpassen
            // Sollte es eine spezielle Nachricht oder einen Kanal geben, in dem du den Sendeplan senden möchtest, passe dies entsprechend an
            // Beispiel: const channel = client.channels.cache.get('CHANNEL_ID');
            // Dann: await extractAndSendScheduleInfo(channel);
            await extractAndSendScheduleInfo(message);
            console.log('Sendeplan erfolgreich verschickt.');
        } catch (error) {
            console.error('Fehler beim geplanten Ausführen der Aufgaben:', error);
        }
    });
});

client.login(discord_token);