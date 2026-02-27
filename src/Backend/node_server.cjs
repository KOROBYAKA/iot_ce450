const express = require('express')
const app = express()
const mqtt = require('mqtt')
const DEV_PORT = 3000

const DataModel = require('./Mongo/MQTTDataSchema.cjs')
const connectToMongoDB = require('./Mongo/mongoose_server.cjs')

const MQTTTopic = 'SendDataToBackend'

app.get('/database/fetch', async (req,res) => {
    try{
        // TODO: Figure out how the fetching should be done.
        // Is everything stored into a single schema property or is every entry seperate?
        const result = await DataModel.find()
        res.status(200).send({msg: 'Getting MongoDB database data', data: result})
    }
    catch(err)
    {
        res.status(500).send({msg: 'something went wrong', err})
    }

})

app.post('/database/insert', async (req,res) => {
    try{
        //TODO: Fix the bufferdata placeholder once the incoming format is known
        const newModelData = new DataModel({timestamp: new Date(), bufferData: 'test'})
        await newModelData.save()
        res.status(200).send('Insert MongoDB database data')
    }
    catch(err)
    {
        res.status(500).send({msg: 'something went wrong', err})
    }
})

app.listen(DEV_PORT, async () => {
    await connectToMongoDB()
    const MQTTClient = mqtt.connect('mqtt://mosquitto:1883')

    MQTTClient.on("connect", () => {
        console.log('connection to MQTT broker successful')
        MQTTClient.subscribe(MQTTTopic, () => {
            console.log(`MQTT Client subscribed to the ${MQTTTopic} topic`)
        }
    )
    })

    MQTTClient.on('message', (topic, payload) => {
        const receivedPayload = JSON.parse(payload)
        const humidity = receivedPayload.humidity
        const temperature = receivedPayload.temperature
        const microphoneLevel = receivedPayload.micLevel

    })

    console.log('server hosting on the specified port')
})