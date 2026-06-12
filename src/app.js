const databse = require('./db/db')

const main = async () => {
    const url = 'mongodb://localhost:27017/patients'    
    // Die Connection zu mongoDB wird über den Port sicher gestellt, weil mongo im Docker Container
    // auf diese Portnummer horcht. Dieser ist gemapped auf den realen Port dieser Nummer. 
    const database = new DataBase(url)
    await database.connect()
    // Do stuff from here...
    
    //...to here.
    await database.endConnection()
}

try {
    main()
} catch (e) {
    console.log(e)
}