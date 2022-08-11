const express = require('express')
const SecFiling = require('../models/secFiling')
const path = require('path');
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

router.get('/getFilingById', async (req,res)=>{
    const urlId = req.query
    const filing = await SecFiling.find(urlId)
    if(filing.length > 0){
        res.status(200).send(filing)
    }
    res.status(404).send()

})

router.get('/', async (req,res)=>{
    res.sendFile(path.join(__dirname+'../../public/index.html'));
})

module.exports = router