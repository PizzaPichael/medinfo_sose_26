import mongoose from 'mongoose'
// MongoDB hat selber kein Schema
// Schemata werden durch mongoose, den Treiber, gestellt

/**
 * Mongoose-Schema für eine FHIR-MedicationStatement-Ressource (Medikamenteneinnahme).
 */
const medicationStatementSchema = new mongoose.Schema({
    resourceType: String,   // "MedicationStatement"
    id: String,             // "123836474"
    identifier: [
        {
            system: String, // "http://hospital.example.org/medstatement-id"
            value: String   // "MS-4521"
        }
    ],
    status: String,         // "active"   PFLICHT. active | completed | entered-in-error | intended | stopped | on-hold | unknown | not-taken
    category: {
        coding: [
            {
                system: String, // "http://terminology.hl7.org/CodeSystem/medication-statement-category"
                code: String,   // "inpatient"
                display: String // "Inpatient"
            }
        ]
    },
    medicationCodeableConcept: {   // medication[x] choice. PFLICHT (eine Variante)
        coding: [
            {
                system: String,  // "http://snomed.info/sct"
                code: String,    // "320176004"
                display: String  // "salbutamol 100micrograms/inhaler"
            }
        ],
        text: String         // "salbutamol 100micrograms/inhaler"
    },
    subject: {               // PFLICHT (1..1)
        reference: String    // "Patient/123836453"
    },
    context: {
        reference: String    // "Encounter/55012"
    },

    effectiveDateTime: String, // "2026-02-11"   (effective[x] choice)
    dateAsserted: String,    // "2026-02-11"
    informationSource: {
        reference: String    // "Patient/123836453"
    },
    reasonCode: [
        {
            coding: [
                {
                    system: String,  // "http://snomed.info/sct"
                    code: String,    // "195967001"
                    display: String  // "asthma (disorder)"
                }
            ],
            text: String         // "asthma"
        }
    ],
    reasonReference: [
        {
            reference: String    // "Condition/98068728"
        }
    ],
    note: [
        {
            text: String         // "Patient self-administers at home."
        }
    ],
    dosage: [
        {
            text: String,        // "2 puffs every 4 hours as needed"
            timing: {
                repeat: {
                    frequency: Number,   // 1
                    period: Number,      // 4
                    periodUnit: String   // "h"   (s | min | h | d | wk | mo | a)
                }
            },
            asNeededBoolean: Boolean, // true   (asNeeded[x] choice)
            route: {
                coding: [
                    {
                        system: String,  // "http://snomed.info/sct"
                        code: String,    // "18679011000036100"
                        display: String  // "inhaled route"
                    }
                ]
            },
            doseAndRate: [
                {
                    doseQuantity: {
                        value: Number,   // 2
                        unit: String,    // "puffs"
                        system: String,  // "http://snomed.info/sct"
                        code: String     // "415215001"
                    }
                }
            ]
        }
    ]
})

export default mongoose.model('MedicationStatement', medicationStatementSchema)