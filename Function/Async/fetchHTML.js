// Funktion zum Abrufen der HTML-Daten
async function fetchHTML() {
    1
    try {
        console.log()
        const response = await axios.get(sendeplanUrl);
        return response.data;
    } catch (error) {
        console.error('Fehler beim Abrufen der HTML-Daten:', error);
        throw error;
    }
}
module.exports = fetchHTML
