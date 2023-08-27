const Discord = require('discord.js');
const axios = require('axios');

const client = new Discord.Client();
const prefix = '!'; // Das Präfix für Bot-Befehle
const wordpressAPI = 'DEINE_WORDPRESS_REST_API_URL'; // URL zur WordPress REST API, z. B. 'https://deinewordpresswebsite.com/wp-json/wp/v2/posts'
const wunschBoxPostID = DEINE_WUNSCHBOX_POST_ID; // ID des WordPress-Beitrags für die Wunschbox
const grussBoxPostID = DEINE_GRUSSBOX_POST_ID; // ID des WordPress-Beitrags für die Grußbox

client.once('ready', () => {
    console.log('Bot ist bereit!');
    checkWordPressPost(); // Überprüfe die WordPress-Beiträge, sobald der Bot bereit ist
    setInterval(checkWordPressPost, 60000); // Überprüfe alle 60 Sekunden die WordPress-Beiträge
});

async function checkWordPressPost() {
    try {
        const response = await axios.get(wordpressAPI);
        const latestPost = response.data[0]; // Annahme: Das neueste Post ist das erste Element im Array

        const title = latestPost.title.rendered;
        const content = latestPost.content.rendered;

        const channel = client.channels.cache.get('DEINE_DISCORD_CHANNEL_ID'); // ID des Discord-Textkanals
        channel.send(`📢 Neuer WordPress Beitrag: ${title}\n\n${content}`);
    } catch (error) {
        console.error('Fehler beim Überprüfen der WordPress-Beiträge:', error);
    }
}

client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'zeigebox') {
        try {
            const wunschBoxResponse = await axios.get(`https://deinewordpresswebsite.com/wp-json/wp/v2/posts/${wunschBoxPostID}`);
            const grussBoxResponse = await axios.get(`https://deinewordpresswebsite.com/wp-json/wp/v2/posts/${grussBoxPostID}`);

            const wunschBoxContent = wunschBoxResponse.data.content.rendered;
            const grussBoxContent = grussBoxResponse.data.content.rendered;

            message.channel.send(`Wunsch-Box:\n${wunschBoxContent}\n\nGruß-Box:\n${grussBoxContent}`);
        } catch (error) {
            console.error('Fehler beim Abrufen der WordPress-Inhalte:', error);
            message.channel.send('Es ist ein Fehler aufgetreten.');
        }
    }
});

// Den Bot mit deinem Token anmelden
client.login('DEIN_DISCORD_BOT_TOKEN');
