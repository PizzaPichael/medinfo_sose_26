import express from 'express'
const app = express()
const port = 3000

app.use(express.json())

// can be extracted to a different file, currently just a test example
const handleHelloWorld = (req, res) => {
    console.log(req.params)
    console.log(req.query)
    console.log(req.body)

    res.status(203).json({ message: 'Hello World!' })
}


const main = async () => {
    // api path definitions
    app.get('/test', handleHelloWorld)

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })
}

try {
    main()
} catch (e) {
    console.log(e)
}