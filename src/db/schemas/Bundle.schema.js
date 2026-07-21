import mongoose from 'mongoose'
// MongoDB hat selber kein Schema
// Schemata werden durch mongoose, den Treiber, gestellt

/**
 * Mongoose-Schema für ein FHIR-Bundle (z.B. eine transaction mit mehreren inline-Ressourcen und Requests).
 */
const bundleSchema = new mongoose.Schema({
    resourceType: String,   // "Bundle"
    type: String,           // "transaction"
    entry: [
        {
            fullUrl: String,    // "urn:uuid:11111111-1111-1111-1111-111111111111"
            resource: {         // ganze Ressource inline, z.B. Patient
                resourceType: String, // "Patient"
                name: [
                    {
                        family: String, // "Ramirez"
                        given: [
                            String      // "Carlos"
                        ]
                    }
                ],
                gender: String,     // "male"
                birthDate: String   // "1974-05-12"
            },
            request: {
                method: String,     // "POST"   (POST | PUT | DELETE | PATCH | GET)
                url: String,        // "Patient"   (POST: nur Typ; PUT: "Patient/123")
                ifNoneExist: String // "identifier=http://hospital.example.org/mrn|CHC-123456"  (optional, conditional create)
            }
        },
        {
            fullUrl: String,    // "urn:uuid:22222222-2222-2222-2222-222222222222"
            resource: {
                resourceType: String, // "Encounter"
                status: String,       // "in-progress"
                subject: {
                    reference: String // "urn:uuid:11111111-1111-1111-1111-111111111111"
                }
            },
            request: {
                method: String,   // "POST"
                url: String       // "Encounter"
            }
        }
    ]
})



export default mongoose.model('Bundle', bundleSchema)