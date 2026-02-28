const express = require('express')
const cors = require('cors')
const app = express()
const mqtt = require('mqtt')
app.use(cors({origin: '*'}))
app.use(express.json())
const DEV_PORT = 3000

const DataModel = require('./Mongo/MQTTDataSchema.cjs')
const connectToMongoDB = require('./Mongo/mongoose_server.cjs')

const MQTTTopic = 'SendDataToBackend'

app.get('/database/fetchLatestBeveragePrice', async (req,res) => {
    try{
        const result =  await DataModel.findOne({}).sort({timestamp: -1});
        if(result != null)
        {
            const {humidity, temperature, micLevel} = result
            // assuming that the base price for coke zero at 10 deg celsius is 2.5 eur, 
            // then the ratio of eur/degree celsius is 0.25 
            // Adjusting for the humidity into the final calculation, I divide this by 2 => this ratio is 0.125

            // assuming also that the humidity at the aforementioned temperature is 50 and humidity ranges from 0 to 100, 
            // then the ratio price to humidity is 0.5. 
            // Adjusting for the temp, this ratio is also divided by 2 => it is 0.25 

            // I haven't included miclevel in the calculations because it is still unclear how it is going to be used

            // The formula for the price of the beverage is thus Temperature*0.125 + Humidity*0.25
            // With the aforementioned considerations, the price should be 2.5.
            const basePrice = 2.5;
            const baseTemperature = 10; 
            const baseHumidity = 50;
            const temperatureCoefficient = (basePrice/baseTemperature) / 2
            const humidityCoefficient = (basePrice/baseHumidity) / 2

            let price = temperatureCoefficient*temperature + humidityCoefficient*humidity
            if(price <= 2.5)
            {
                price = 2.5
            }
            res.status(200).send({msg: 'Getting MongoDB database data', beverageData: {price, temperature, humidity, micLevel}})
        }
        else
        {
            res.status(404).send({msg: 'No records exist in the database yet. Wait for the MQTT data to come in. If it is not coming in, then there is an issue with its transportation somewhere', beverageData: {}})

        }
    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({msg: 'something went wrong', err})
    }

})

app.get('/database/getHistoricalData', async (req,res) => {
    try{
        const result =  await DataModel.find()

        res.status(200).send({msg: 'Getting historical MongoDB database data', historicalData: result})
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