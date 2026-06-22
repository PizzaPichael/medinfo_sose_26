import mongoose from 'mongoose'

/** Schema for a FHIR Procedure resource based on https://fhir.hl7.org/fhir/procedure.html */
const procedureSchema = new mongoose.Schema({
    procedureId: { type: String, required: true, index: true },
    id: String,
    status: { type: String, required: true }, // e.g. completed
    code: {
        coding: [{ system: String, code: String, display: String }],
        text: String
    },
    subject: { reference: String, display: String }, // Patient reference
    encounter: { reference: String },
    occurrenceDateTime: Date, // when procedure occurred
    performer: [
        {
            actor: { reference: String, display: String }
        }
    ],
    reason: [
        {
            concept: {
                text: String
            }
        }
    ],
    note: [ { authorString: String, time: Date, text: String } ],
    bodySite: [
        {
            coding: [{ system: String, code: String, display: String }],
            text: String
        }
    ],
    followUp: [ { text: String } ]
})

export default mongoose.model('Procedure', procedureSchema)
