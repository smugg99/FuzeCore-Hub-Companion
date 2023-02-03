const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Mustache = require('mustache');
const config = require('../config.json');

const command = new SlashCommandBuilder()
	.setName('purge')
	.setDescription('Mass deletes messages in a channel')
	.addIntegerOption(option =>
		option
			.setDescription('Amount of messages to delete')
			.setName('amount')
			.setRequired(true))	
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
	.setDMPermission(false);

async function execute(interaction) {
	const _amount = interaction.options.getInteger('amount');

	var amount = _amount < 100 ? (_amount <= 0 ? 1 : _amount) : 99;
	var deletedMessages;

	try {
		deletedMessages = await interaction.channel.bulkDelete(amount);
	} catch (error) {
		console.log(error);
		await interaction.reply({ content: config.messages.purgeError, ephemeral: true }); return;
	}

	await interaction.reply({ content: Mustache.render(config.messages.purgeSuccess, { amount: deletedMessages.size }), ephemeral: true });
}

module.exports = { data: command, execute }