// Funktion zur Extrahierung der Sendeplaninformationen und Speicherung in einer Datei
async function extractAndSendScheduleInfo(message, schedule) {
    try {
        // Pfad zur JSON-Datei festlegen
        const jsonFilePath = 'PlanDaten.json';

        // �berpr�fen, ob die JSON-Datei existiert
        if (!fs.existsSync(jsonFilePath)) {
            console.error('Die JSON-Datei existiert nicht.');
            message.channel.send('Die JSON-Datei existiert nicht.');
            return;
        }

        // JSON-Datei lesen und Daten parsen
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        const sendeplanData = JSON.parse(jsonContent);

        // �berpr�fen, ob die Sendeplaninformationen vorhanden und nicht leer sind
        if (!sendeplanData || !Array.isArray(sendeplanData) || sendeplanData.length === 0) {
            console.error('Ung�ltige oder leere Sendeplaninformationen.');
            message.channel.send('Ung�ltige oder leere Sendeplaninformationen.');
            return;
        }
        // Pfad zur HTML-Datei festlegen
        const htmlFilePath = 'mod.html';

        // HTML-Datei lesen und Inhalt in htmlData speichern
        const htmlData = fs.readFileSync(htmlFilePath, 'utf8');

        // Durch jeden Eintrag im Sendeplan iterieren und nur g�ltige Eintr�ge senden
        for (const entry of sendeplanData) {
            if (entry.zeit && entry.beschreibung && entry.moderator) {
                const { zeit, beschreibung, moderator, istEvent } = entry;

                // Filtere g�ltige Eintr�ge im Sendeplan
                const validEntries = sendeplanData.filter(entry => entry.zeit && entry.beschreibung && entry.moderator);

                // Durch jeden g�ltigen Eintrag im Sendeplan iterieren und Nachrichten senden
                for (const entry of validEntries) {
                    const { zeit, beschreibung, moderator, istEvent } = entry;

                    // Bild-URL f�r den Moderator extrahieren
                    const moderatorImageUrl = extractModeratorImageUrl(htmlData, moderator);
                }
            }

            const embed = new MessageEmbed()
                .setTitle(`:radio: Sendeplan ${formattedDate} :radio:`)
                .addFields(
                    { name: 'Uhrzeit', value: zeit },
                    { name: 'Moderator', value: moderator, inline: true },
                    { name: 'Beschreibung', value: beschreibung },
                    { name: 'Event', value: istEvent ? 'Ja' : 'Nein' }
                )
                .setImage(moderatorImageUrl) // Hier das Bild einf�gen
                .setFooter({ text: 'Powered by DBKS' });

            // Wenn es sich um ein Event handelt, setze die Farbe auf gr�n
            if (istEvent) {
                embed.setColor('#00FF00'); // Hier die gew�nschte Farbe f�r den gr�nen Balken einf�gen
            }
            // Discord-Webhook erstellen und Nachricht senden
            const webhookClient = new WebhookClient({ url: webhookUrl });
            await webhookClient.send({ embeds: [embed] });

            console.log(`Sendeplan erfolgreich in Discord gepostet f�r Zeit: ${zeit}`);
        }

        console.log('Sendeplaninformationen wurden erfolgreich verarbeitet.');

    } catch (error) {
        console.error('Fehler beim Abrufen des Sendeplans oder Senden der Nachricht:', error);
    }
}
module.exports = extractAndSendScheduleInfo