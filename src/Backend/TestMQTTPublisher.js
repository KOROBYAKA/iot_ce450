// This file is for the purposes of testing the MQTT publishing. 
// This would be done by the arduino
// Run this file with node TestMQTTPublisher.js in the directory it is in
// If everything worked out, it should say that connecting to the mqtt broker was successful.
// Close the file from the terminal, using ctrl+c
// This should trigger the frontend page to update the data it has displayed there
const express = require('express')
const app = express()
const mqtt = require('mqtt')

app.listen(4001, async () => {
const MQTTClient = mqtt.connect('mqtt://localhost:1883')

    MQTTClient.on("connect", () => {
            console.log('connection to MQTT broker successful')

        MQTTClient.publish('SendDataToBackend', JSON.stringify({humidity:20 , temperature:-30, micLevel: 10}), (error) => {
            if (error) {
                console.error(error)
            }
            })

        })
})