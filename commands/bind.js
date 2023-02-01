const { SlashCommandBuilder, PermissionFlagsBits, GuildBan, ChannelType } = require('discord.js');
const channel_binds = require('../channel_binds.js');
const config = require('../config.json');

const command = new SlashCommandBuilder()
	.setName('bind')
	.setDescription('Binds chosen text channel with specific bot\'s feature')
	.addChannelOption(channel =>
		channel
			.setName('channel')
			.setDescription('Text channel to bind the feature to')
			.setRequired(true))
	.addStringOption(option =>
		option
			.setName('feature')
			.setDescription('Bot\'s feature')
			.setRequired(true)
			.addChoices(
				{ name: 'Set general', value: 'general' },
				{ name: 'Set commands', value: 'commands' },
				{ name: 'Set announcements', value: 'announcements' },
				{ name: 'Set bans', value: 'bans' },
			))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
	.setDMPermission(false);


async function execute(interaction) {
	const channel = interaction.options.getChannel('channel');
	const feature = interaction.options.getString('feature');
	console.log(channel, feature);

	if (!channel.isTextBased()) {
		await interaction.reply({ content: config.messages.channelUnbindable , ephemeral: true }); return;
	}

	try {
		var success = channel_binds.bindChannel(channel, feature);
		if (!success) {
			await interaction.reply({ content: config.messages.channelBindingError, ephemeral: true }); return;
		}
	} catch (error) {
		console.log(error);
		await interaction.reply({ content: config.messages.channelBindingError, ephemeral: true }); return;
	}

	await interaction.reply({ content: config.messages.chann , ephemeral: true });
}

module.exports = { data: command, execute }