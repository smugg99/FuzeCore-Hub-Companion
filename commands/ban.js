const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dayjs = require('dayjs');
const Mustache = require('mustache');
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
				{ name: 'permament', value: '-1' },
				{ name: '~15 seconds', value: '0.005' },
				{ name: '1 hour', value: '1' },
				{ name: '6 hours', value: '6' },
				{ name: '12 hours', value: '12' },
				{ name: '1 day', value: '24' },
				{ name: '2 days', value: '48' },
				{ name: '4 days', value: '72' },
				{ name: '7 days', value: '96' },
				{ name: '12 days', value: '288' },
				{ name: '1 month', value: '720' },
				{ name: '2 months', value: '1440' },
				{ name: '6 months', value: '4320' },
				{ name: '1 year', value: '8640' },
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
	const banReason = interaction.options.getString('reason') ?? config.generics.defaultBanReason;
	const timestamp = Date.now();

	console.log(targetUser, guildMember, banDuration, banReason);
	console.log(guildMember);
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
	user_bans.registerBan(targetUser, banDuration, banReason, interaction.guild.id, timestamp);

	// This is used to format variables into the json string
	const replyContent = Mustache.render(config.messages.banSuccess, {
		name: targetUser.username + '#' + targetUser.discriminator,
		duration: banDuration,
		reason: banReason,
	});
	console.log(replyContent);
	await interaction.reply({ content: replyContent, ephemeral: true });
}

module.exports = { data: command, execute }