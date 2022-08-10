const {TwitterClient} = require('twitter-api-client')

const twitterClient = new TwitterClient({
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

const sendTweet = (status) =>
    twitterClient.tweets.statusesUpdate({
        status
    }).then (response => {
        console.log("Tweeted!", response)
    }).catch(err => {
        console.error(err)
    })

module.exports={
    sendTweet
}