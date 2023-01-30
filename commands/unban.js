const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const user_bans = require('../user_bans.js');

const command = new SlashCommandBuilder()
	.setName('unban')
	.setDescription('Unbans selected user')
	.addUserOption(option =>
		option
			.setName("user")
			.setDescription("User to unban")
			.setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setDMPermission(false);


async function execute(interaction) {
	const targetUser = interaction.options.getUser('user');

	try {
		interaction.guild.members.unban(targetUser);
	} catch (error) {
		console.log(error);
		await interaction.reply({ content: config.messages.unbanError, ephemeral: true }); return;
	}

	// If the action was a success, unregister the ban
	user_bans.unregisterBan(targetUser);
	await interaction.reply({ content: 'Unbanning user: ' + targetUser.username, ephemeral: true });
}

module.exports = { data: command, execute }