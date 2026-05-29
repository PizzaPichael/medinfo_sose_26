const mongoose = require('mongoose')

import kittySchema from './schema/Kitty.schema'

const Kitten = mongoose.model('Kitten', kittySchema);

const main = async () => {
    const db = await mongoose.connect('mongodb://localhost:27017/test')
    console.log('Connected...')

    const silence = new Kitten({ name: 'Silence' })
    console.log(silence.name) // 'Silence'
    await silence.save()

    await mongoose.disconnect()
}

try {
    main()
} catch (e) {
    console.log(e)
}