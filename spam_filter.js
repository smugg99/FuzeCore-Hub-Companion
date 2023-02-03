function levenshteinDistance(stringA, stringB) {
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

function similarityScore(stringA, stringB) {
	let distance = levenshteinDistance(stringA, stringB);
	let maxLength = Math.max(stringA.length, stringB.length);

	return 1 - distance / maxLength;
}

function filterMessage(message) {
	console.log(similarityScore(message.content, "nigga aaaa sex"));
}

module.exports = { filterMessage };