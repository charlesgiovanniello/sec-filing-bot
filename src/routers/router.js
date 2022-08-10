const express = require('express')
const SecFiling = require('../models/secFiling')
const router = new express.Router

router.post('/addFiling', async (req,res) =>{
    const filing = new SecFiling(req.query)
    try{
        await filing.save()
        res.status(201).send({filing})
    }catch(e){
        res.status(400).send(e)
    }
})

router.get('/getFilingByUrl', async (req,res)=>{
    const url = req.query
    const filing = await SecFiling.find(url)
    if(filing.length > 0){
        res.status(200).send(filing)
    }
    res.status(404).send()

})

module.exports = router