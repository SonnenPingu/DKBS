// Ist server online funktion.
async function isServerOnline(serverURL) {
    try {
        const response = await axios.head(serverURL);
        return response.status === 200; // Überprüft, ob der Server mit Statuscode 200 antwortet (OK)
    } catch (error) {
        console.error('Fehler beim Überprüfen des Serverstatus:', error);
        return false; // Der Server wird als offline betrachtet, wenn eine Ausnahme auftritt
    }
}
module.exports = isServerOnline
