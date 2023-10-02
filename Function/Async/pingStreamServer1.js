// Abfrage PingStreamServer1
async function pingStreamServer1(channelId) {
    try {
        const roundTripTime = await pingHTTPServer(streamURLServer1); // Round-Trip-Zeit f�r Server 1 erhalten
        const isServerOnlineResult = await isServerOnline(streamURLServer1);
        console.log('Server 1 Online-Status:', isServerOnlineResult);

        const channelServerStatus = client.channels.cache.get(channelId);

        // Hier eine Statusnachricht generieren, �hnlich wie in checkStreamStatusServer1
        const serverName = 'StreamServer'; // Setzen Sie den Namen Ihres Servers
        const onlineStatus = isServerOnlineResult ? true : false; // Hier wird der Online-Status als boolescher Wert �bergeben

        const statusMessage = generateStatusMessage(serverName, onlineStatus, roundTripTime);

        // Nachricht senden
        channelServerStatus.send(statusMessage);

    } catch (error) {
        console.error('Fehler beim Pingen und Aktualisieren des Status auf Server 1:', error);
    }
}
module.exports = pingStreamServer1