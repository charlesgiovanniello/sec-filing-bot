const axios = require("axios")
const express = require("express")
require('./db/mongoose')
const router = require('./routers/router')
const convert = require('xml-js');
const {analyzeFiling} = require('./analyzeFiling')
const {getFileName} = require('./getFileName')
const cron = require('node-cron');
const {sendTweet} = require('./twitter')
const TinyURL = require('tinyurl');

const app = express()
app.use(express.json())
app.use(router)
module.exports = app

//Define headers for SEC Site (User agent)
axios.defaults.headers = {
    'User-Agent': 'Giovanniello charles.giovanniello@gmail.com'
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const hashtagList = ["#stocks","#trading","#finance","#insidertrading","#assets","#wallstreetbets","#wallstreet","#wealth","#generationalWealth"]
const hashtagGenerator = ()=>{
    var arr = [];
    while(arr.length < 2){
        var r = Math.floor(Math.random() * hashtagList.length - 1) + 1;
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    return `${hashtagList[arr[0]]} ${hashtagList[arr[1]]}`
}

const getFilings = () => {
    return new Promise((resolve)=>{
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=only&start=0&count=10&output=atom`
        axios.get(url)
        .then(async res=>{
            const result = convert.xml2json(res.data, {compact: true, spaces: 4})
            const json = JSON.parse(result)
            let entries = json.feed.entry
            if(!(entries instanceof Array)){
                entries = [entries]
            }
            for (let i=0; i<entries.length;i++){
                let reportUrl = entries[i].link._attributes.href
                let reportTitle = entries[i].title._text
                //Check if the entry contains a link and that it's of type Reporting (Not Issuer, this would create duplicates)
                if(entries[i].link && reportTitle.includes('(Reporting)')){
                    console.log(reportTitle)
                    // link is the reports file directory, needed to get the report file name via web scrape
                    let link = (reportUrl).substring(0,reportUrl.lastIndexOf('/'))+"/"
                    let linkParts = link.split( '/' )
                    let urlId = linkParts[ linkParts.length - 2 ]
                    console.log(urlId)
                    let fileName = await getFileName(link)
                    link = link + fileName +".xml"
                    
                    //If link is not in database, analyze, send tweet.
                    try{
                        await axios.get(`http://localhost:${process.env.PORT}/getFilingById?urlId=${urlId}`)
                        console.log("Found")
                    }catch(e){
                        console.log("Not found")
                        if(e.response.status == 404){
                            await axios.post(`http://localhost:${process.env.PORT}/addFiling?urlId=${urlId}`)
                            let tweet = await analyzeFiling(link)
                            if(tweet.length > 0){
                                let url = await TinyURL.shorten(reportUrl)
                                let hashTags = hashtagGenerator()
                                tweet = `${tweet} ${hashTags}\n\nSource: ${url}`
                                //sendTweet(tweet) // send tweet
                                console.log(tweet)
                            }
                        }else{
                            console.log(e.response.status)
                        }
                    }
                }
                await sleep(4000) //to avoid accidental DDOS
            }
            resolve()
        }).catch(err => console.log(err));
    })
}

getFilings()
cron.schedule('*/10 * * * *', async () => {
    await getFilings()
});
