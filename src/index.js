const Parse = require('parse/node')
const app = require('./app')
const port = process.env.PORT

const APP_ID='cUl76S52AcDBwkoI822Drdcamd6YpREPifrhyw9z'
const JAVASCRIPT_ID = 'gGKHmT5uFjmkwln2FrEPyxR4zLwwdASjvwyPvX5s'
Parse.initialize(APP_ID,JAVASCRIPT_ID)
Parse.serverURL='https://sec-filing-bot.back4app.com'
app.listen(port, ()=>{
    console.log("Server is up on port " + port)
} )

