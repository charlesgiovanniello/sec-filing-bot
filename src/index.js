const Parse = require('parse/node')
const app = require('./app')
const port = process.env.PORT

Parse.initialize(APP_ID,JAVASCRIPT_ID)
app.listen(port, ()=>{
    console.log("Server is up on port " + port)
} )

