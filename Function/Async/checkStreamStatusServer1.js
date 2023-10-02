async function checkStreamStatusServer1() {
    try {
        // Holen der HTML-Seite von Server 1
        const responseServer1 = await axios.get(streamURLServer1);

        if (!responseServer1 || !responseServer1.data) {
            console.error('Keine Daten von Server 1 erhalten oder ungültige Antwort.');
            return;
        }

        // Extrahieren der Informationen aus dem HTML mit dem angegebenen CSS-Pfad
        const server1Data = responseServer1.data;

        // Hier verwenden wir cheerio, um den Moderator, Interpreten und Titel zu extrahieren
        const $ = cheerio.load(server1Data);
        const anchorElement = $('body > table:nth-child(4) > tbody > tr:nth-child(8) > td:nth-child(2) > b > a');
        const text = anchorElement.text().trim();

        // Überprüfung auf leere Werte
        if (!text) {
            console.error('Ungültige Werte für Nachricht auf Server 1.');
            return;
        }

        // Extrahieren von Moderator, Interpret und Titel
        let finalModerator = 'DBKS'; // Standardwert, falls der Trennstrich "|" nicht gefunden wird
        let artist = '';
        let title = '';

        if (text.includes('|')) {
            const [titleAndArtist, moderator] = text.split(' | ');
            [artist, title] = titleAndArtist.split(' - ');
            if (moderator) {
                finalModerator = moderator;
            }
        } else {
            [artist, title] = text.split(' - ');
        }

        // Überprüfen, ob Interpret und Titel vorhanden sind
        if (!artist || !title) {
            console.error('Ungültige Werte für Nachricht auf Server 1.');

            // Fallback-Titel und Interpret, wenn keine gefunden werden
            artist = 'Kiwi Sound';
            title = 'Der böse';

            // Fallback für Moderator, wenn kein Moderator nach dem | gefunden wird
            if (text.includes('<a href="currentsong?sid=1">')) {
                finalModerator = text.split('<a href="currentsong?sid=1">')[1].split('</a>')[0];
            }
        }

        // Überprüfen, ob sich die Informationen geändert haben
        if (lastPlayedTitle !== title || lastPlayedArtist !== artist) {
            // Hier kannst du die gewonnenen Informationen verwenden
            console.log('Moderator auf Server 1:', finalModerator);
            console.log('Interpret auf Server 1:', artist);
            console.log('Titel auf Server 1:', title);

            // Erstelle ein Embed oder sende eine Nachricht mit den Informationen
            const channelServer1 = client.channels.cache.get('1145840462826053652'); // Aktualisiere die Kanal-ID für Server 1

            if (!channelServer1) {
                console.error('Kanal für Server 1 nicht gefunden.');
                return;
            }

            const embed = new MessageEmbed()
                .setColor(0x00ff00)
                .setDescription(`🎙️ Live ist **${finalModerator}!**\nGespielt wird *${title}* von *${artist}*.`);

            if (!embed.description) {
                console.error('Embed-Beschreibung ist leer.');
                return;
            }

            channelServer1.send({ embeds: [embed] });

            // Aktualisiere die zuletzt gespielten Informationen
            lastPlayedTitle = title;
            lastPlayedArtist = artist;
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Stream-Status auf Server 1:', error);
    }
}


module.exports = checkStreamStatusServer1