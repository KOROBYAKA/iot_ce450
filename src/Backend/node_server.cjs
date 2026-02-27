const express = require('express')
const app = express()
const mqtt = require('mqtt')
const DEV_PORT = 3000

const DataModel = require('./Mongo/MQTTDataSchema.cjs')
const connectToMongoDB = require('./Mongo/mongoose_server.cjs')

const MQTTTopic = 'SendDataToBackend'

app.get('/database/fetch', async (req,res) => {
    try{
        const result = await DataModel.find()
        res.status(200).send({msg: 'Getting MongoDB database data', data: result})
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

    MQTTClient.on('message', async (topic, payload) => {
        try {
            const receivedPayload = JSON.parse(payload);
            const { humidity, temperature, micLevel } = receivedPayload;

            const newModelData = new DataModel({timestamp: new Date(), humidity, temperature, micLevel})
            await newModelData.save()

        } catch (err) {
            console.error('Error processing MQTT message:', err);
        }
    });

    console.log('server hosting on the specified port')
})