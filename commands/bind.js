const { SlashCommandBuilder, PermissionFlagsBits, GuildBan, ChannelType } = require('discord.js');
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
			.addChoices(
				{ name: 'Show total members amount', value: '1' },
				{ name: 'Show online members amount', value: '2' },
				{ name: 'Show offline members amount', value: '3' },
				{ name: 'Set general', value: '4' },
				{ name: 'Set commands', value: '5' },
				{ name: 'Set announcements', value: '6' }
			))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
	.setDMPermission(false);


async function execute(interaction) {
	const channel = interaction.options.getChannel('channel');
	console.log(channel);

	await interaction.reply({ content: 'Test' , ephemeral: true });
}

module.exports = { data: command, execute }