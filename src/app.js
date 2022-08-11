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

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const getFilings = () => {
    return new Promise((resolve)=>{
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=only&start=0&count=10&output=atom`
        axios.get(url)
        .then(async res=>{
            if(!res.data.includes("No recent filings")){
                const result = convert.xml2json(res.data, {compact: true, spaces: 4})
                const json = JSON.parse(result)
                let entries = json.feed.entry
                if(!(entries instanceof Array)){
                    entries = [entries]
                }
                //console.log(entries)
                for(let i=0; i<entries.length;i++){
                    if(entries[i].link){
                        let link = (entries[i].link._attributes.href).substring(0,entries[i].link._attributes.href.lastIndexOf('/'))+"/"
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
                            console.log("Not Found")
                            let tweet = await analyzeFiling(link)
                            if(tweet.length > 0){
                                let url = await TinyURL.shorten(entries[i].link._attributes.href)
                                tweet = `${tweet}#stocks #investing \n\nSource: ${url}`
                                sendTweet(tweet)
                                console.log(tweet)
                            }
                            await axios.post(`http://localhost:${process.env.PORT}/addFiling?urlId=${urlId}`)
                        }
                    }
                    await sleep(4000) //to avoid accidental DDOS
                    
                }
            }else{
                console.log("No recent filings for ")
            }
            resolve()
        })
    })
}
getFilings()
cron.schedule('*/10 * * * *', async () => {
    await getFilings()
});

// const test =  async () => {
//     await getFilings()
// }
// test()