//Funktion zum Parsen der Uhrzeit und Umwandeln in Minuten seit Mitternacht
function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}
module.exports = parseTime