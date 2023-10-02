// Funktion zum Extrahieren der Bild-URL für den Moderator
function extractModeratorImageUrl(htmlData, moderatorName) {
    const $ = cheerio.load(htmlData);
    const imgTags = $('img.img-responsive');

    for (let i = 0; i < imgTags.length; i++) {
        const imgTag = $(imgTags[i]);
        const src = imgTag.attr('src');
        if (src && src.includes(moderatorName)) {
            return src;
        }
    }

    // Wenn kein Bild gefunden wurde, gib einen Standard-URL zurück
    return 'https://mystic-celduin.de/wp-content/uploads/2023/10/WhatsApp-Bild-2023-08-31-um-21.10.02.jpg';
}
module.exports = extractModeratorImageUrl