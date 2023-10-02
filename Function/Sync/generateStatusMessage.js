// Funktion für um eine StautsMessage zu genieren.
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
module.exports = generateStatusMessage