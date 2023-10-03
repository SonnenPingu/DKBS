// Erstelle die "OnAir"-Schaltfläche
async function createOnAirButton(channel, onAirRoleId) {
    const onAirMessage = await channel.send('Klicke auf das Symbol für die "OnAir" Anzeige! 🎙️');
    await onAirMessage.react('🎙️');

    const filter = (reaction, user) => reaction.emoji.name === '🎙️' && !user.bot;
    const collector = onAirMessage.createReactionCollector({ filter, time: 60000 });

    collector.on('collect', async (reaction, user) => {
        await toggleOnAirRole(user, channel, onAirRoleId);
        await reaction.users.remove(user.id);
    });
}
// Export command 
module.export = createOnAirButton(channel, onAirRoleId) 
