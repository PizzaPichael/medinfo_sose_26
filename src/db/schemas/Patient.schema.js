const mongoose = require('mongoose')  
// MongoDB hat selber kein Schema
// Schemata werden durch mongoose, den Treiber, gestellt

const patientSchema = new mongoose.Schema({
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
        ]


})

export default patientSchema