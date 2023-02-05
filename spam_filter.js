const { EmbedBuilder, PermissionFlagsBits, italic } = require('discord.js');
const check_permissions = require('./check_permissions.js');
const config = require('./config.json');

const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
const mentionRegex = /<@!?(\d+)>/g;
const specialCharRegex = /[^\w\s]/g;

const tagReasons = {
	tooMuchProhibitedThings: config.spamFilter.reasons.tooMuchProhibitedThings,
	tooHighSimilarityScore: config.spamFilter.reasons.tooHighSimilarityScore,
	tooMuchRepetitiveness: config.spamFilter.reasons.tooMuchRepetitiveness,
	messagedTooOften: config.spamFilter.reasons.messagedTooOften
}

function levenshteinDistance(stringA, stringB) {
	if (stringA === null || stringB == null) { return 0; }
	if (stringA.length === 0) { return stringB.length; }
	if (stringB.length === 0) { return stringA.length; }
 
	var matrix = [];
 
	for (var i = 0; i <= stringB.length; i++) { matrix[i] = [i]; }
	for (var j = 0; j <= stringA.length; j++) { matrix[0][j] = j; }
 
	for (i = 1; i <= stringB.length; i++) {
    	for (j = 1; j <= stringA.length; j++) {
      		if (stringB.charAt(i - 1) == stringA.charAt(j - 1)) {
        		matrix[i][j] = matrix[i-1][j - 1];
      		} else {
        		matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
			}
		}
	}
 
	return matrix[stringB.length][stringA.length];
}

function findRepeatingPattern(string) {
	let repeatingPattern = "";

	for (let i = 0; i < string.length / 2; i++) {
		let pattern = string.substring(0, i + 1);
		let repeated = true;

		for (let j = i + 1; j < string.length - i; j += i + 1) {
			if (string.substring(j, j + i + 1) !== pattern) {
				repeated = false; break;
			}
		}

		if (repeated) {
			repeatingPattern = pattern; break;
		}
	}

	return repeatingPattern;
}

function countDuplicateWords(string) {
	let wordsAmount = {};
	let words = string.split(" ");

	for (let i = 0; i < words.length; i++) {
		if (wordsAmount.hasOwnProperty(words[i])) {
			wordsAmount[words[i]]++;
		} else {
			wordsAmount[words[i]] = 1;
		}
	}

	return [wordsAmount, words.length];
}

function getSimilarityScore(stringA, stringB) {
	let distance = levenshteinDistance(stringA, stringB);
	let maxLength = Math.max(stringA.length, stringB.length);

	return 1 - distance / maxLength;
}

function getAmountsOfProhibitedThings(message) {
	const linksArray = message.content.match(linkRegex);
	const mentionsArray = message.content.match(mentionRegex);
	const specialCharsArray = message.content.match(specialCharRegex);

	return {
		links: linksArray ? linksArray.length : 0,
		mentions: mentionsArray ? mentionsArray.length : 0,
		specialCharacters: specialCharsArray ? specialCharsArray.length : 0
	};
}

function calculateMaxAmountsOfProhibitedThings(wordsAmount) {
	const limitsPerWord = config.spamFilter.limitsPerWord;
	const minLimits = config.spamFilter.minLimits;

	return {
		links: Math.round(minLimits.links + limitsPerWord.links * wordsAmount),
		mentions: Math.round(minLimits.mentions + limitsPerWord.mentions* wordsAmount),
		specialCharacters: Math.round(minLimits.specialCharacters + limitsPerWord.specialCharacters * wordsAmount)
	};
}

async function getRoughlyPreviousMessage(newMessage) {
    const previousMessages = await newMessage.channel.messages.fetch({ limit: 10, cache: false });
	const sameAuthorOtherMessages = previousMessages.filter(message => message.author.id === newMessage.author.id && message.id !== newMessage.id);
	
	return sameAuthorOtherMessages.size <= 0 ? null : sameAuthorOtherMessages.first();
}

function getTimeDifferenceFromMessages(newMessage, previousMessage) {
    return newMessage.createdTimestamp - previousMessage.createdTimestamp;
}

function buildEmbedForSpamWarning(message, reason) {
	var description = reason || config.generics.defaultSpamWarnReason;
	var messageBuffer;

	if (message.cleanContent.length >= config.spamFilter.minMessageLengthForFileUpload) {
		messageBuffer = Buffer.from(message.cleanContent);
	} else {
		description = italic(description) + '\n"' + message.cleanContent + '"'
	}

	const spamWarningEmbed = new EmbedBuilder()
		.setTitle(config.messages.userSpamWarned)
		.setThumbnail('attachment://thumbnail.png')
		.setColor(config.colors.secondary)
		.setDescription(description)
		.setFooter({ text: config.spamFilter.warningFooter });
	
	return [spamWarningEmbed, messageBuffer];
}

function isMessageValid(message) {
	return ((message.author && (message.author.bot === true || message.author.system === true)) || !message.guild) ? false : true;
}

async function takeActions(message, guildMember, reason) {
	const [spamWarningEmbed, taggedMessageBuffer] = buildEmbedForSpamWarning(message, reason);
	
	try {
		message.delete();
	} catch (error) {
		console.log(error); return;
	}

	try {
		guildMember.timeout(config.spamFilter.defaultTimeoutDuration, config.spamFilter.defaultSpamWarnReason);
	} catch (error) {
		console.log(error); return;
	}

	guildMember.send({
		embeds: [spamWarningEmbed],
		files: [{
			attachment: config.images.warningIcon,
			name: 'thumbnail.png'
		}]
	}).then(() => {
		if (!taggedMessageBuffer) { return; }
		guildMember.send({
			files: [{
				attachment: taggedMessageBuffer,
				name: config.spamFilter.taggedMessageFileName
			}]
		})
	}).catch(error => console.log(error));
}

async function filterMessage(message) {
	if (!isMessageValid(message)) { return [false]; }

	const guildMember = await message.guild.members.cache.get(message.author.id);
	if (!guildMember || check_permissions(guildMember, PermissionFlagsBits.KickMembers)) { return [false, guildMember]; }

	const [duplicateWords, wordsAmount] = countDuplicateWords(message.content);
	console.log('Duplicate words: ', duplicateWords, wordsAmount);
	console.log('\n');

	const previousMessage = await getRoughlyPreviousMessage(message);
	if (previousMessage) {
		console.log('Previous message: ', previousMessage.content, '\n');

		const similarityScore = getSimilarityScore(message.content, previousMessage.content);
		const timeDifference = getTimeDifferenceFromMessages(message, previousMessage);
		const minTimeBetweenMessages = config.spamFilter.minTimeBetweenMessages + (wordsAmount * config.spamFilter.cooldownDurationPerWord);

		console.log('Similarity score: ', similarityScore);
		console.log('Time difference: ', timeDifference);
		console.log('Min time difference: ', minTimeBetweenMessages);
	
		if (similarityScore >= config.spamFilter.maxSimilarityScore) { return [true, guildMember, tagReasons.tooHighSimilarityScore]; }
		if (timeDifference <= minTimeBetweenMessages) { return [true, guildMember, tagReasons.messagedTooOften]; }
	}

	const amountsOfProhibitedThings = getAmountsOfProhibitedThings(message);
	const maxAmountsOfProhibitedThings = calculateMaxAmountsOfProhibitedThings(wordsAmount);
	console.log('\nAmounts of prohibited things: ', amountsOfProhibitedThings);
	console.log('Max amounts of prohibited things: ', maxAmountsOfProhibitedThings);
	
	if (
		amountsOfProhibitedThings.links >= maxAmountsOfProhibitedThings.links ||
		amountsOfProhibitedThings.mentions >= maxAmountsOfProhibitedThings.mentions ||
		amountsOfProhibitedThings.specialCharacters >= maxAmountsOfProhibitedThings.specialCharacters
	) {
		return [true, guildMember, tagReasons.tooMuchProhibitedThings];
	}

	// const repeatingPattern = findRepeatingPattern(message.content);
	// console.log('Repeating pattern: ', repeatingPattern, '\n');

	// if (repeatingPattern) { return [true, guildMember, tagReasons.tooMuchRepetitiveness]; }

	return [false, guildMember];
}

module.exports = { filterMessage, takeActions, isMessageValid };