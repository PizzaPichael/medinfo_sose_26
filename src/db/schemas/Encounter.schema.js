import mongoose from 'mongoose'

/** Schema for a FHIR Encounter resource based on https://fhir.hl7.org/fhir/encounter.html */
const encounterSchema = new mongoose.Schema({
    encounterId: {
        type: String,
        required: true,
        index: true
    },
    id: String,
    status: String,
    'class': [
        {
            coding: [
                {
                    system: String,
                    code: String,
                    display: String
                }
            ]
        }
    ],
    subject: {
        reference: String,
        display: String
    },
    subjectStatus: {
        coding: [
            {
                system: String,
                code: String
            }
        ]
    },
    participant: [
        {
            type: [
                {
                    coding: [
                        {
                            system: String,
                            code: String,
                            display: String
                        }
                    ]
                }
            ],
            individual: {
                reference: String,
                display: String
            }
        }
    ],
    period: {
        start: Date
    },
    location: [
        {
            location: {
                reference: String,
                display: String
            }
        }
    ]
})

export default mongoose.model('Encounter', encounterSchema)
