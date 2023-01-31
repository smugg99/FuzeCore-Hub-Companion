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
	const amount = _amount < 100 ? _amount : 99

	var amountPurged = 0;

	try {
		var fetchedMessages = await interaction.channel.messages.fetch({ limit: amount, cached: false });

		const fetchedMessagesArray = Array.from(fetchedMessages.values());
		fetchedMessagesArray.forEach(message => { amountPurged += 1; message.delete(); });
	} catch (error) {
		console.log(error);
		await interaction.reply({ content: config.messages.purgeError, ephemeral: true }); return;
	}

	await interaction.reply({ content: Mustache.render(config.messages.purgeSuccess, { amount: amountPurged }), ephemeral: true });
}

module.exports = { data: command, execute }