// Hauptfunktion zum Extrahieren und Speichern der Daten
async function extractAndSaveData() {
    try {
        console.log('Die extractAndSaveData() - Funktion wird aufgerufen.'); // Hinzugefügt

        const htmlData = await fetchHTML();
        console.log('HTML-Daten erfolgreich abgerufen.'); // Hinzugefügt

        const $ = cheerio.load(htmlData);

        // Erstelle ein leeres Array, um die Daten zu speichern
        const sendeplan = [];

        // Durchlaufe die Tabellenzeilen und extrahiere die Informationen
        $('tbody tr').each((index, element) => {
            const row = $(element);

            // Extrahiere die Zeit
            const zeit = row.find('td:nth-child(1)').text().trim();

            // Extrahiere die Beschreibung
            const beschreibung = row.find('td:nth-child(2) a').text().trim();

            // Extrahiere den Moderator
            const moderator = row.find('td:nth-child(3)').text().trim();

            // Überprüfe, ob es sich um ein Event handelt
            const istEvent = row.hasClass('table-success');

            // Füge die Daten dem sendeplan-Array hinzu
            sendeplan.push({
                zeit,
                beschreibung,
                moderator,
                istEvent,
            });
        });

        console.log('Daten erfolgreich extrahiert und in das sendeplan-Array eingefügt.'); // Hinzugefügt

        // Speichere die Daten in einer JSON-Datei
        fs.writeFileSync('PlanDaten.json', JSON.stringify(sendeplan, null, 2));

        console.log('Daten erfolgreich in PlanDaten.json gespeichert.'); // Hinzugefügt

    } catch (error) {
        console.error('Fehler beim Extrahieren und Speichern der Daten:', error);
    }
}
module.exports = extractAndSaveData