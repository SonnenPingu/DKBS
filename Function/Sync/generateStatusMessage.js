// Funktion f�r um eine StautsMessage zu genieren.
function generateStatusMessage(serverName, onlineStatus, roundTripTime) {
    let color;

    if (onlineStatus) {
        color = '#00ff00'; // Gr�ner Balken f�r Online
        onlineStatus = 'Online';
    } else {
        color = '#ff0000'; // Roter Balken f�r Offline
        onlineStatus = 'Offline';
    }

    // Hier k�nnen Sie Ihre Statusnachricht erstellen und zur�ckgeben
    const embed = new MessageEmbed()
        .setColor(color)
        .setDescription(`**Server: ${serverName}**
Status: ${onlineStatus}
Ping: ${roundTripTime} ms`);

    return { embeds: [embed] };
}
module.exports = generateStatusMessage