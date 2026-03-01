const mongoose = require('mongoose')

const MQTTDataSchema = new mongoose.Schema({
    timestamp: {type: Date, required: true}, 
    humidity: {type: Number, required: true},
    temperature: {type: Number, required: true},
    micLevel: {type: Number, required: true},
    senseID: {type: String, required: true}

})

const DataModel = mongoose.model('DataModel', MQTTDataSchema);

module.exports = DataModel