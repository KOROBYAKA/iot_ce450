const mongoose = require('mongoose')

const MQTTDataSchema = new mongoose.Schema({
    timestamp: {type: Date, required: true}, 
    // TODO: The format of the buffer data is to be clarified
    // TODO: Figure out of we want to store everything seperately, 
    // i.e. is every MQTT request to the backend a seperate entry in the DB or not
    bufferData: {type: String, required: true}
})

const DataModel = mongoose.model('DataModel', MQTTDataSchema);

module.exports = DataModel