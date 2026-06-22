import mongoose from 'mongoose'

/** Schema for a FHIR Consent resource based on https://fhir.hl7.org/fhir/consent.html */
const consentSchema = new mongoose.Schema({
    consentId: {
        type: String,
        required: true,
        index: true
    },
    id: String,
    text: {
        status: String,
        div: String
    },
    meta: {
        versionId: String,
        lastUpdated: Date,
        source: String
    },
    status: String,
    scope: {
        coding: [
            {
                system: String,
                code: String
            }
        ]
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
        reference: String,
        display: String
    },
    patient: {
        reference: String
    },
    date: Date,
    dateTime: Date,
    controller: [
        {
            reference: String
        }
    ],
    sourceAttachment: [
        {
            title: String
        }
    ],
    regulatoryBasis: [
        {
            coding: [
                {
                    system: String,
                    code: String
                }
            ]
        }
    ],
    decision: String,
    provision: [
        {
            type: {
                type: String
            },
            period: {
                start: Date,
                end: Date
            },
            class: [
                {
                    code: String
                }
            ]
        }
    ]
})

export default mongoose.model('Consent', consentSchema)
