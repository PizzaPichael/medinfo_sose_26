class Handler {

    constructor(client) {
        this.dataBaseClient = client
        console.log('[HANDLER] Created...')
    }

    endDbConenction = async () => {
        await databaseClient.endConnection()
    }

    test = (req, res) => {
        res.status(203).json({ message: 'test Endpoint called' })
    }

    registerPatient = (req, res) => {
        const name = req.query.name
        const birthdate = req.query.birthdate
        res.status(200).json({ message: 'registerPatient request accepted' })
    }
}

export default Handler
