// Funktion zum Überprüfen und Aktualisieren der OnAir-Rolle
async function toggleOnAirRole(user, channel, onAirRoleId) {
    if (!user.bot) {
        const member = channel.guild.members.cache.get(user.id);
        if (member.roles.cache.has(onAirRoleId)) {
            // Benutzer hat bereits die "OnAir"-Rolle, entferne sie
            await member.roles.remove(onAirRoleId);
        } else {
            // Benutzer hat die "OnAir"-Rolle nicht, füge sie hinzu
            await member.roles.add(onAirRoleId);
        }
    }
   // Export command
module.export = toggleOnAirRole(user,channel,onAirRoleId) 
