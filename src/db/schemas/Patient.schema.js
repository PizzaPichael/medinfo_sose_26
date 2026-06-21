import mongoose from 'mongoose'
// MongoDB hat selber kein Schema
// Schemata werden durch mongoose, den Treiber, gestellt

const patientSchema = new mongoose.Schema({
    resourceType: String,   // "Patient"
    id: String,             // "131896579"
    identifier: [
        {
            system: String, // "http://hospital.example.org/mrn"
            value: String   // "CHC-123456"
        }
    ],
    active: Boolean,        // true
    name: [
        {
            use: String,    // "official"
            family: String, // "Ramirez"
            given: [
                String      // "Carlos"
            ]
        }
    ],
    telecom: [
        {
            system: String, // "phone"
            value: String,  // "+1-413-555-0123"
            use: String     // "home"
        }
    ],
    gender: String,         // "male"
    birthDate: String,      // "1974-05-12"  (date, YYYY-MM-DD)
    address: [
        {
            use: String,        // "home"
            line: [
                String          // "125 Community Way"
            ],
            city: String,       // "Springfield"
            state: String,      // "MA"
            postalCode: String, // "01109"
            country: String     // "US"
        }
    ],
    maritalStatus: {
        coding: [
            {
                system: String,  // "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus"
                code: String,    // "S"
                display: String  // "Never Married"
            }
        ]
    },
    communication: [
        {
            language: {
                coding: [
                    {
                        system: String,  // "urn:ietf:bcp:47"
                        code: String,    // "en"
                        display: String  // "English"
                    }
                ]
            },
            preferred: Boolean   // true
        }
    ]
})



export default mongoose.model('Patient', patientSchema)