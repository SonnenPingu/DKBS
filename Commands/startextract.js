// commands/startextract.js
const { Command } = require('discord.js-commando');
const { extractAndSaveData } = require('./your-file-path'); // Pfad zur Datei, die die Funktion extractAndSaveData enthält

module.exports = class StartExtractCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'startextract',
            group: 'general',
            memberName: 'startextract',
            description: 'Manuelle Datenextraktion starten.',
        });
    }

    async run(message) {
        try {
            await extractAndSaveData();
            message.channel.send('Datenextraktion erfolgreich abgeschlossen und gespeichert.');
        } catch (error) {
            console.error('Fehler beim manuellen Starten der Datenextraktion:', error);
            message.channel.send('Fehler beim manuellen Starten der Datenextraktion.');
        }
    }
};
