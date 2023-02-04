const config = require('./config.json');

const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
const mentionRegex = /<@!?(\d+)>/g;
const specialCharRegex = /[^\w\s]/g;

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

function getSimilarityScore(stringA, stringB) {
	let distance = levenshteinDistance(stringA, stringB);
	let maxLength = Math.max(stringA.length, stringB.length);

	return 1 - distance / maxLength;
}

function getAmountsOfProhibitedThings(message) {
	const links = message.content.match(linkRegex);
	const mentions = message.content.match(mentionRegex);
	const specialChars = message.content.match(specialCharRegex);

	return {
		links: links ? links.length : 0,
		mentions: mentions ? mentions.length : 0,
		specialCharacters: specialChars ? specialChars.length : 0
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

async function filterMessage(message) {
	if (message.author && (message.author.bot === true || message.author.system === true)) { return; }

	const previousMessage = await getRoughlyPreviousMessage(message);
	console.log('Previous message: ', previousMessage);

	if (previousMessage) {
		const similarityScore = getSimilarityScore(message.content, previousMessage.content);
		const timeDifference = getTimeDifferenceFromMessages(message, previousMessage);
		
		console.log('Similarity score: ', similarityScore);
		console.log('Time difference: ', timeDifference);
	}
	
	const amountsOfProhibitedThings = getAmountsOfProhibitedThings(message);

	console.log('Amount of prohibited things: ', amountsOfProhibitedThings);
}

module.exports = { filterMessage };