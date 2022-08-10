const convert = require('xml-js');
const axios = require("axios")

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

        try{
            const xml = await axios.get(link)
            const result = convert.xml2json(xml.data, {compact: true, spaces: 4})
            const json = JSON.parse(result)
            filerName = json.ownershipDocument.reportingOwner.reportingOwnerId.rptOwnerName._text
            //filerName = filerName.split(" ")[1] + " " + filerName.split(" ")[0]
            try{
                filerTitle = json.ownershipDocument.reportingOwner.reportingOwnerRelationship.officerTitle._text
            }catch(e){
                filerTitle = "executive figure"
            }
            filerCompany = json.ownershipDocument.issuer.issuerName._text
            filerTicker = json.ownershipDocument.issuer.issuerTradingSymbol._text
            let transactionsArray = json.ownershipDocument.nonDerivativeTable.nonDerivativeTransaction
            if(!(transactionsArray instanceof Array)){
                transactionsArray = [transactionsArray]
            }
            //parse throught the table of each nonDerivativeTransaction object. Looks for S's
            for(let i = 0; i< transactionsArray.length;i++){
                let type = transactionsArray[i].transactionCoding.transactionCode._text
                //console.log(type)
                if(type == "S"){
                    shares += parseInt(transactionsArray[i].transactionAmounts.transactionShares.value._text)
                    sumOfPricePerShare += parseInt(transactionsArray[i].transactionAmounts.transactionPricePerShare.value._text)
                    numTransactions++
                }
            }
            averagePricePerShare = sumOfPricePerShare / numTransactions
        }catch(e){
            console.log("An error was encountered analyzing this file",e)
            resolve("")
        }
        console.log("Num transactinos",numTransactions)
        if(numTransactions > 0){
            resolve(`JUST FILED: ${filerName}, ${filerTitle} of ${filerCompany} has sold ${shares.toLocaleString() } shares of the company at an average price of $${averagePricePerShare} per share for a total of $${(shares*averagePricePerShare).toLocaleString()}. \n\n#${filerTicker}`)
        }
        else{
            resolve("")
        }
    })
}

module.exports={
    analyzeFiling
}