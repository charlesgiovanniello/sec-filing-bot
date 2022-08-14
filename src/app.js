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
const {createNewOrder,getAlpacaAccount} = require('./alpaca')

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
                            let {committedType,
                                shares,
                                filerTicker,
                                filerName,
                                filerTitle,
                                filerCompany,
                                averagePricePerShare,
                                transactionDate} = await analyzeFiling(link)
                            if(!(committedType===undefined)){
                                let url = await TinyURL.shorten(reportUrl)
                                let tweet = `JUST FILED: ${filerName}, (${filerTitle}) of ${filerCompany} ${(committedType==="P")?'purchased':'sold'} ${shares.toLocaleString()} shares of the company at an average price of $${averagePricePerShare} per share for a total of $${(shares*averagePricePerShare).toLocaleString()}.\n\nDate: ${transactionDate} \n\n$${filerTicker} ` + `#stocks #investing \n\nSource: ${url}`
                                
                                //sendTweet(tweet) // send tweet
                                //Send alpaca order
                                createNewOrder(filerTicker,committedType === 'S'? 'sell':'buy')
                                console.log(tweet)
                            }
                            await axios.post(`http://localhost:${process.env.PORT}/addFiling?urlId=${urlId}&committedType=${committedType}&shares=${shares}&filerTicker=${filerTicker}&filerName=${filerName}&filerTitle=${filerTitle}&filerCompany=${filerCompany}&averagePricePerShare=${averagePricePerShare}&transactionDate=${transactionDate}`)
                            
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
