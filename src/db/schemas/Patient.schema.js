import mongoose from 'mongoose'
// MongoDB hat selber kein Schema
// Schemata werden durch mongoose, den Treiber, gestellt

const patientSchema = new mongoose.Schema({
    patientId: {
      type: String,
      required: true,
      index: true
    },
    id: String,  // "131896579"
    name: [
        {
            use: String,    // "official"
            family: String, // "Ramirez"
            given: [
                String  // "Carlos"
            ] 
        }
    ],
    gender: String, // "male"
    birthDate: String,  // "1974-05-12"
    address: [
          {
            use: String, // "home"
            line: [
              String    // "125 Community Way"
            ],
            city: String,   // "Springfield"
            state: String,  // "MA"
            postalCode: String, // "01109"
            country: String // "US"
          }
        ],
    timestamp: { type: Date, default: Date.now } // Konfigurationsobjekt ermöglicht mehr Anpassungen für Schemas

})



export default mongoose.model('Patient', patientSchema)