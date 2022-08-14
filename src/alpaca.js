const Alpaca = require('@alpacahq/alpaca-trade-api')

const maxAmount = 10000

const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_SECRET_KEY,
    // keyId:'PK0TJGNYJU3C95MJTS0Z',
    // secretKey:'S0t6e44PB0DZxMXdJAZNWjn4SY0i728DwT1mxWx4',
    paper: true,
  })


const getAlpacaAccount = () =>{
    alpaca.getAccount().then((account) => {
        console.log('Current Account:', account)
      })
}  

const getAssetPrice = async(ticker) =>{
    const assetPrice = (await alpaca.getSnapshot(ticker)).LatestTrade.Price
    return assetPrice
}
const createNewOrder = async (ticker,action) =>{
    const currentPrice = await getAssetPrice(ticker)
    const numShares = Math.floor(maxAmount / currentPrice)
    alpaca.createOrder({
        symbol:ticker,
        qty:numShares,
        side:action,
        type:'market',
        time_in_force:'day'
    })
    console.log(`Just purchased${numShares} of ${ticker}`)
}

module.exports={
    createNewOrder,
    getAlpacaAccount
}
