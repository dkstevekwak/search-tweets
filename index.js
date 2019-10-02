const request = require('request-promise');
const consumerKey = require('./public/config.js').consumerKey;
const consumerSecret = require('./public/config.js').consumerSecret;
const Base64 = require('js-base64').Base64;
const Twitter = require('twitter');
const tokenUrl = "https://api.twitter.com/oauth2/token";

async function main() {
	let finalResults = [];
	const accessToken = await getAccessToken();
	while (finalResults.length < 50) {
		const response = await searchTweets(accessToken, "dog%20OR%20cat");
		const tweets = response.statuses;
		const results = filter(tweets, finalResults);
		finalResults = finalResults.concat(results);
	}
	const top50 = finalResults.slice(0, 50)
	console.log(top50)
}

function filter(tweets, finalResults) {
	let results = [];
	let existingIds = [];
	if (finalResults.length) existingIds = finalResults.map(tweet => tweet.id);
	tweets.forEach(tweet => {
		if ("hashtags" in tweet.entities && "media" in tweet.entities && !existingIds.includes(tweet.id)) {
			if (hashtagNotCaturday(tweet.entities.hashtags) && hasImageOrVideo(tweet.entities.media)) {
				results.push(tweet);
			}
		}
	})
	return results;
}

function hashtagNotCaturday(hashtags) {
	return hashtags.every(hashtag => {
		return hashtag.text.toLowerCase() !== "caturday"
	})
}

function hasImageOrVideo(media) {
	return media.some(singleMedia => {
		return singleMedia.type === "photo" || singleMedia.type === "video";
	})
}

async function getAccessToken() {
	const base64encoded = Base64.encode(`${consumerKey}:${consumerSecret}`);

	const authOptions = {
		method: "POST",
		uri: `${tokenUrl}?grant_type=client_credentials`,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			"Authorization": `Basic ${base64encoded}`
		},
		json: true
	};

	const response = await request(authOptions);
	const accessToken = response.access_token;
	return accessToken;
}

async function searchTweets(token, term) {
	const client = new Twitter({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		bearer_token: token
	});

	return new Promise((resolve, reject) => {
		client.get('search/tweets', {
			q: term, count: 100, result_type: "recent"
		}, (error, tweets, response) => {
			if (error) reject(error);
			resolve(tweets);
		});
	})
}

main();