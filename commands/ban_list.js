const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const Mustache = require('mustache');
const config = require('../config.json');
const user_bans = require('../user_bans.js');

const command = new SlashCommandBuilder()
	.setName('banlist')
	.setDescription('Shows every banned user on the server with some additional data')
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setDMPermission(false);

async function execute(interaction) {
	const banList = await interaction.guild.bans.fetch(); 
	const banListArray = Array.from(banList.values());

	const embedMessage = new EmbedBuilder()
		.setTitle('📜 **Banned Users List** 📜')
		.setColor(config.colors.secondary);
	
	var description = '';

	banListArray.forEach((guildBan) => {
		const wholeUsername = guildBan.user.username + '#' + guildBan.user.discriminator;
		const wholeReason = 'Reason: ' + guildBan.reason;
		const wholeUserId = 'User Id: ' + guildBan.user.id;
		var banEndsOnTimestamp = '(no ban record found)';
		
		const banRecord = user_bans.getBanRecordFromUserId(guildBan.user.id);
		if (banRecord) {
			const banRecordObject = JSON.parse(banRecord);
			if (banRecordObject.timestamp && banRecordObject.duration) {
				const banEndTimestamp = banRecordObject.timestamp + banRecordObject.duration;

				const timestamp = dayjs(banEndTimestamp).utc().format('DD/MM/YYYY HH:mm');
				banEndsOnTimestamp = 'Ends on: ' + timestamp + ' UTC';
			}
		}

		description += '╔═[' + wholeUsername + ']\n╠═' + wholeUserId + '\n╠═' + wholeReason + '\n╚═' + banEndsOnTimestamp + '\n\n';
	})
	
	embedMessage.setDescription(description.length >= 1 ? description : config.messages.listEmpty);

	if (banListArray.length >= 1) {
		embedMessage.setFooter({ text: Mustache.render(config.messages.listContainsAmount, {
			amount: banListArray.length
		}) });
	}

	return interaction.reply({ embeds: [embedMessage], ephemeral: true });
}

module.exports = { data: command, execute }