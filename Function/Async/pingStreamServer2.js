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
module.exports = pingStreamServer2