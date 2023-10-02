// commands/ping.js
const { Command } = require('discord.js-commando');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            group: 'general',
            memberName: 'ping',
            description: 'Ping!',
        });
    }

    async run(message) {
        // Hier den Code für den ping-Befehl einfügen
        const pingMessage = await pingStreamServer1(channelServer1Id); // Hier die Kanal-ID für Server 1 einfügen
        if (pingMessage && pingMessage.content) {
            message.channel.send(pingMessage).then(msg => msg.delete()); // Nachricht senden und sofort löschen
        }

        const pingMessage2 = await pingStreamServer2(channelServer2Id); // Hier die Kanal-ID für Server 2 einfügen
        if (pingMessage2 && pingMessage2.content) {
            message.channel.send(pingMessage2).then(msg => msg.delete()); // Nachricht senden und sofort löschen
        }

        message.delete(); // Lösche die ursprüngliche Nachricht
    }
};
