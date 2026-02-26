const mongoose = require('mongoose')

//TODO: Update the configurations to correspond to the dockerized when dockerizing
const connectToMongoDB = async() => {
    try{
        await mongoose.connect('mongodb://mongo_container:27017/IoT')
        .then((res) => {
            console.log('connection to mongo established')
        })
        .catch((err) => {
            console.log('something went wrong with the mongo connection')
            console.log(err)
        })
    }
    catch(err)
    {
        console.log(err)
    }

}

module.exports = connectToMongoDB