import mongoose from 'mongoose'

/** Schema for a FHIR Consent resource based on https://fhir.hl7.org/fhir/consent-example.json.html */
const consentSchema = new mongoose.Schema({
    consentId: {
        type: String,
        required: true,
        index: true
    },
    id: String, // "consent-example-basic"
    text: {
        status: String, // "generated"
        div: String
    },
    status: {
        type: String, // "active"
        required: true,
    }, 
    category: [
        {
            coding: [
                {
                    system: String,
                    code: String
                }
            ]
        }
    ],
    subject: {
        reference: {
            type: String, // Patient ID, e.g. "Patient/123"
            required: true
        },
        display: String // Optional: "Patient Name"
    },
    date: Date, // "2018-12-28"
    controller: [
        {
            reference: String // "Organization/f001"
        }
    ],
    sourceAttachment: [
        {
            title: String // "The terms of the consent in lawyer speak."
        }
    ],
    regulatoryBasis: [
        {
            coding: [
                {
                    system: String, // "http://terminology.hl7.org/CodeSystem/v3-ActCode"
                    code: String // "INFA"
                }
            ]
        }
    ],
    decision: {
        type: String, // "permit" or "deny"
        required: true
    },
    period: {
        type: {
            _id: false,
            start: Date, // "1964-01-01"
            end: Date // "2019-01-01"
        },
        required: true
    }
})

export default mongoose.model('Consent', consentSchema)
