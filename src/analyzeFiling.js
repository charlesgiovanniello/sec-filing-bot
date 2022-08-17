const convert = require('xml-js');
const axios = require("axios")
const thresholdTransactionAmount = 1000000
//Define headers for SEC Site
axios.defaults.headers = {
    'User-Agent': 'Giovanniello charles.giovanniello@gmail.com'
}

//Un-reverse name, properly case it, remove extra commas
const normalizeName = (s) =>{
    if(s.toLowerCase().includes('llc')){
        return(s)
    }
    filerNamePieces = s.split(" ")
    s = s.replace(filerNamePieces[0],"")
    s = (s + " " +filerNamePieces[0]).trim()
    s=s.toLowerCase()
    let returnMe = ""
    let arr=s.split(" ")
    arr.forEach(str=> {
        returnMe += str.charAt(0).toUpperCase() + str.slice(1) + " "
    })
    returnMe = returnMe.replace(',','').trim()
    return(returnMe)
}

const analyzeFiling = (link) =>{
    return new Promise(async (resolve) =>{
        let filerName
        let filerTitle
        let filerCompany
        let shares = 0
        let filerTicker
        numTransactions=0
        let sumOfPricePerShare = 0
        let averagePricePerShare = 0
        let type
        let committedType
        let transactionDate

        try{
            const xml = await axios.get(link)
            const result = convert.xml2json(xml.data, {compact: true, spaces: 4})
            const json = JSON.parse(result)
            filerName = normalizeName(json.ownershipDocument.reportingOwner.reportingOwnerId.rptOwnerName._text)

            try{
                filerTitle = json.ownershipDocument.reportingOwner.reportingOwnerRelationship.officerTitle._text
                if(filerTitle === undefined){
                    filerTitle = "executive / entity"
                }
            }catch(e){
                filerTitle = "executive / entity"
            }
            filerCompany = json.ownershipDocument.issuer.issuerName._text
            filerTicker = json.ownershipDocument.issuer.issuerTradingSymbol._text
            let transactionsArray = json.ownershipDocument.nonDerivativeTable.nonDerivativeTransaction
            if(!(transactionsArray instanceof Array)){
                transactionsArray = [transactionsArray]
            }
            transactionDate = transactionsArray[0].transactionDate.value._text
            //parse throught the table of each nonDerivativeTransaction object. Looks for S's
            for(let i = 0; i< transactionsArray.length;i++){
                type = transactionsArray[i].transactionCoding.transactionCode._text
                //committedType will determine if this will be a buy or sell report. Preventing adding sells to purchaes if in same report
                if((type == "S" || type == "P") && !committedType){
                    committedType = type
                }
                if(type === committedType){
                    shares += parseInt(transactionsArray[i].transactionAmounts.transactionShares.value._text)
                    sumOfPricePerShare += parseInt(transactionsArray[i].transactionAmounts.transactionPricePerShare.value._text)
                    numTransactions++
                }
            }
            averagePricePerShare = (sumOfPricePerShare / numTransactions).toFixed(2);
        }catch(e){
            console.log("An error was encountered analyzing this file",e)
            resolve("")
        }
        if(numTransactions > 0 && (shares*averagePricePerShare) > thresholdTransactionAmount){
            resolve(`🗄JUST FILED: $${filerTicker} (${filerCompany})\n🤖WHO: ${filerName} (${filerTitle})\n🚨${(committedType==='P')?'BOUGHT':'SOLD'}: ${shares.toLocaleString()} shares @ $${averagePricePerShare} per share\n🤑TOTAL: $${(shares*averagePricePerShare).toLocaleString()}\n\n`)
            //resolve(`JUST FILED: ${filerName}, (${filerTitle}) of ${filerCompany} ${(committedType==="P")?'purchased':'sold'} ${shares.toLocaleString()} shares of the company at an average price of $${averagePricePerShare} per share for a total of $${(shares*averagePricePerShare).toLocaleString()}.\n\nDate: ${transactionDate} \n\n$${filerTicker}`)
        }
        else{
            resolve("")
        }
    })
}

module.exports={
    analyzeFiling
}