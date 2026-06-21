import mongoose from 'mongoose'
// MongoDB hat selber kein Schema
// Schemata werden durch mongoose, den Treiber, gestellt

const conditionSchema = new mongoose.Schema({
    resourceType: String,   // "Condition"
    id: String,             // "98068728"
    identifier: [
        {
            system: String, // "http://hospital.example.org/condition-id"
            value: String   // "COND-7788"
        }
    ],
    clinicalStatus: {       // active | recurrence | relapse | inactive | remission | resolved | unknown
        coding: [
            {
                system: String, // "http://terminology.hl7.org/CodeSystem/condition-clinical"
                code: String    // "active"
            }
        ]
    },
    verificationStatus: {   // unconfirmed | provisional | differential | confirmed | refuted | entered-in-error
        coding: [
            {
                system: String, // "http://terminology.hl7.org/CodeSystem/condition-ver-status"
                code: String    // "confirmed"
            }
        ]
    },
    category: [
        {
            coding: [
                {
                    system: String, // "http://terminology.hl7.org/CodeSystem/condition-category"
                    code: String,   // "problem-list-item"
                    display: String // "Problem List Item"
                }
            ]
        }
    ],
    severity: {
        coding: [
            {
                system: String, // "http://snomed.info/sct"
                code: String,   // "24484000"
                display: String // "Severe"
            }
        ]
    },
    code: {
        coding: [
            {
                system: String, // "http://snomed.info/sct"
                code: String,   // "239873007"
                display: String // "Osteoarthritis of knee"
            }
        ],
        text: String        // "Unilateral primary osteoarthritis, right knee"
    },
    bodySite: [
        {
            coding: [
                {
                    system: String, // "http://snomed.info/sct"
                    code: String,   // "72696002"
                    display: String // "Right knee"
                }
            ]
        }
    ],
    subject: {              // PFLICHT (1..1)
        reference: String   // "Patient/98067569"
    },
    encounter: {
        reference: String   // "Encounter/55012"
    },
    onsetDateTime: String,  // "2022-04-01"   (onset[x] choice)
    abatementDateTime: String, // "2023-01-15"   (abatement[x] choice)
    recordedDate: String,   // "2022-05-15"
    recorder: {
        reference: String   // "Practitioner/77"
    },
    asserter: {
        reference: String   // "Practitioner/77"
    },
    note: [
        {
            text: String    // "Patient reports pain worsening when climbing stairs."
        }
    ]
})



export default mongoose.model('Condition', conditionSchema)