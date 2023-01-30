const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const user_bans = require('../user_bans.js');

const command = new SlashCommandBuilder()
	.setName('ban')
	.setDescription('Bans selected user')
	.addUserOption(option =>
		option
			.setName("user")
			.setDescription("User to ban")
			.setRequired(true))
	.addStringOption(option =>
		option
			.setName("duration")
			.setDescription("Duration of the ban")
			.addChoices(
				{ name: 'Permament', value: '-1' },
				{ name: '~15 Seconds', value: '0.005' },
				{ name: '1 Hour', value: '1' },
				{ name: '6 Hours', value: '6' },
				{ name: '12 Hours', value: '12' },
				{ name: '1 Day', value: '24' },
				{ name: '2 Days', value: '48' },
				{ name: '4 Days', value: '72' },
				{ name: '7 Days', value: '96' },
				{ name: '12 Days', value: '288' },
				{ name: '1 Month', value: '720' },
				{ name: '2 Months', value: '1440' },
				{ name: '6 Months', value: '4320' },
				{ name: '1 Year', value: '8640' },
			)
			.setRequired(true))
	.addStringOption(option =>
		option
			.setName("reason")
			.setDescription("Reason for the ban")
			.setRequired(false))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setDMPermission(false);

async function execute(interaction) {
	const targetUser = interaction.options.getUser('user');
	const guildMember = await interaction.guild.members.cache.get(targetUser.id);
	const banDuration = interaction.options.getString('duration');
	const banReason = interaction.options.getString('reason') ?? config.defaultBanReason;

	console.log(targetUser, guildMember, banDuration, banReason);

	if (!guildMember || targetUser.bot == true || targetUser.system == true) {
		await interaction.reply({ content: config.messages.userNotBannable, ephemeral: true }); return;
	}

	try {
		await guildMember.ban({ reason: banReason });
	} catch (error) {
		console.log(error);
		await interaction.reply({ content: config.messages.banError, ephemeral: true }); return;
	}

	// If the action was a success, register the ban
	user_bans.registerBan(targetUser, banDuration, banReason, interaction.guild.id);
	await interaction.reply({ content: 'Banning user: ' + targetUser.username + ' for reason: ' + banReason, ephemeral: true });
}

module.exports = { data: command, execute }