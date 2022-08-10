const axios = require('axios')
//const link = "https://www.sec.gov/Archives/edgar/data/1318605/000089924322028176/"

const getFileName = (link) =>{
    return new Promise((resolve,reject)=>{
        try{
            axios.get(link).then(res=>{
                //console.log(res.data)
                const fileName =res.data.match(/[^\/]+(?=.xml)/gm)[0]
                resolve(fileName)
            })
        }catch(e){
            reject("File not found")
        }
    })
}

module.exports={
    getFileName
}