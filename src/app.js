const axios = require("axios")
const express = require("express")
require('./db/mongoose')
const router = require('./routers/router')
const convert = require('xml-js');
const {analyzeFiling} = require('./analyzeFiling')
const {getFileName} = require('./getFileName')
const cron = require('node-cron');
const {sendTweet} = require('./twitter')

const app = express()
app.use(express.json())
app.use(router)
module.exports = app

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const getFilings = (company) => {
    return new Promise((resolve)=>{
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=${company}&dateb=&owner=only&start=0&count=40&output=atom`
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
                        console.log(link)
                        let fileName = await getFileName(link)
                        link = link + fileName +".xml"
                        
                        //If link is not in database, analyze, send tweet.
                        try{
                            await axios.get(`http://localhost:${process.env.PORT}/getFilingByUrl?url=${link}`)
                            console.log("Found")
                        }catch(e){
                            console.log("Not Found")
                            let tweet = await analyzeFiling(link)
                            if(tweet.length > 0){
                                tweet = `${tweet}#stocks #investing \n\nSource: ${entries[i].link._attributes.href}`
                                sendTweet(tweet)
                                console.log(tweet)
                            }
                            await axios.post(`http://localhost:${process.env.PORT}/addFiling?url=${link}`)
                        }
                    }
                    await sleep(4000) //to avoid accidental DDOS
                }
            }else{
                console.log("No recent filings for " + company)
            }
            resolve()
        })
    })
}
const companies = ["tesla","amazon","cloudflare","apple","microsoft","meta","exxon","procter","salesforce","pfizer","moderna","American Assets Trust"]
//const companies = ["American Assets Trust"]

cron.schedule('*/10 * * * *', async () => {
    for(let i=0;i<companies.length;i++){
        await getFilings(companies[i])
        await sleep(4000)
    }
});

// const test =  async () => {
//     for(let i=0;i<companies.length;i++){
//         await getFilings(companies[i])
//         await sleep(5000)
//     }
// }
// test()

