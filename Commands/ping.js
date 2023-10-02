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
        // Hier den Code f�r den ping-Befehl einf�gen
        const pingMessage = await pingStreamServer1(channelServer1Id); // Hier die Kanal-ID f�r Server 1 einf�gen
        if (pingMessage && pingMessage.content) {
            message.channel.send(pingMessage).then(msg => msg.delete()); // Nachricht senden und sofort l�schen
        }

        const pingMessage2 = await pingStreamServer2(channelServer2Id); // Hier die Kanal-ID f�r Server 2 einf�gen
        if (pingMessage2 && pingMessage2.content) {
            message.channel.send(pingMessage2).then(msg => msg.delete()); // Nachricht senden und sofort l�schen
        }

        message.delete(); // L�sche die urspr�ngliche Nachricht
    }
};
