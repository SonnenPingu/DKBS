// Anpingen des Servers
async function pingHTTPServer(serverURL) {
    try {
        const startTime = Date.now(); // Zeit vor dem Senden der Anfrage

        await axios.get(serverURL);

        const endTime = Date.now(); // Zeit nach dem Empfang der Antwort
        const roundTripTime = endTime - startTime; // Berechnung der Round-Trip-Zeit in Millisekunden

        return roundTripTime;
    } catch (error) {
        console.error('Fehler beim Pingen des HTTP-Servers:', error);
        return -1; // Oder eine andere geeignete Fehlermeldung oder -1, um anzuzeigen, dass das Pingen fehlgeschlagen ist
    }
    module.exports = pingHTTPServer 