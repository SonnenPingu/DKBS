// commands/plan.js
const { Command } = require('discord.js-commando');
const { extractAndSendScheduleInfo } = require('./your-file-path'); // Pfad zur Datei, die die Funktion extractAndSendScheduleInfo enth�lt

module.exports = class PlanCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'plan',
            group: 'general',
            memberName: 'plan',
            description: 'Sende Sendeplaninformationen.',
        });
    }

    async run(message) {
        try {
            await extractAndSendScheduleInfo(message);
            message.channel.send('Befehl "/plan" wurde ausgef�hrt.');
        } catch (error) {
            console.error('Fehler beim Ausf�hren des Befehls "/plan":', error);
            message.channel.send('Fehler beim Ausf�hren des Befehls "/plan".');
        }
    }
};
