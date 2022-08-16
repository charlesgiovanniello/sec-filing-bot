const mongoose = require('mongoose')

const secFilingSchema = new mongoose.Schema({
    urlId:{
        type:String
    }
},{timestamps:true

})

const SecFiling = mongoose.model('SecFiling',secFilingSchema)
module.exports = SecFiling