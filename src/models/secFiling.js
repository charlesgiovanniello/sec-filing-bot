const mongoose = require('mongoose')

const secFilingSchema = new mongoose.Schema({
    url:{
        type:String
    }
},{timestamps:true

})

const SecFiling = mongoose.model('SecFiling',secFilingSchema)
module.exports = SecFiling