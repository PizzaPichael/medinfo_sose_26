const databse = require('./db/db')

const main = async () => {
    const url = 'mongodb://localhost:27017/test'
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