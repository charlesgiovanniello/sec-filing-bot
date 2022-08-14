const mongoose = require('mongoose')

const secFilingSchema = new mongoose.Schema({
    urlId:{
        type:String
    },
    committedType:{
        type:String
    },
    shares:{
        type:Number
    },
    filerTicker:{
        type:String
    },
    filerName:{
        type:String
    },
    filerTitle:{
        type:String
    },
    filerCompany:{
        type:String
    },
    averagePricePerShare:{
        type:Number
    },
    transactionDate:{
        type:Date
    }
},{timestamps:true

})

const SecFiling = mongoose.model('SecFiling',secFilingSchema)
module.exports = SecFiling