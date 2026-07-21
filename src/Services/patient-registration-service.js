import { randomUUID } from 'node:crypto'
import AppError from '../errors/AppError.js'

const tiebreaker = ['maritalStatus', 'address', 'telecom']

class PatientRegistration {

    constructor(localDbClient, fhirClient) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        console.log('[PATIENT-REGISTRATION] Created...')
    }

    
    getPatientFromDb = async (dbClient, patientJson) => {
        console.log(`[REGISTRATION] getPatientFromDb called with ${dbClient.constructor.name}`)
        let getPatientResponse = null
        let wantedPatientInstance = null
        // Get the name of the patient to register that is saved as its official name
        const official = patientJson.name.find(name => name.use == 'official')
        const filterAttributes = {
            'family': official.family,
            'given': official.given[0],
            'birthdate': patientJson.birthDate
        }
        getPatientResponse = await dbClient.getPatientByFilter(filterAttributes)
        if(getPatientResponse.length != 0) {
            wantedPatientInstance = getPatientResponse.length > 1 ? tiebreak(getPatientResponse, patientJson) : getPatientResponse[0]
            console.log(`[REGISTRATION] Patient found.`)
            return wantedPatientInstance
        }
        console.log(`[REGISTRATION] No patient found.`)
        return null
    }

    /**
     * 
     * @param {*} patientJson 
     * @returns 
     */
    registerPatient = async (patientJson) => {
        console.log('[REGISTRATION] registerPatient called')
        const wantedLocalPatientInstance = await this.getPatientFromDb(this.dataBaseClient, patientJson)
        const wantedFhirPatientInstance = await this.getPatientFromDb(this.fhirClient, patientJson)

        let outputPatientInstance = wantedLocalPatientInstance
        // If no local patient exist, but fhir patient exists, create locla patient from fhir
        if(!outputPatientInstance && wantedFhirPatientInstance) {
            console.log('[REGISTRATION] No local patient found, creating patient from fhir')
            return await this.createPatient(wantedFhirPatientInstance)
        }

        // If neither local, nor fhir patient exist, create new local patient from input data
        if(!outputPatientInstance && !wantedLocalPatientInstance && !wantedFhirPatientInstance) {
            console.log('[REGISTRATION] No local or fhir patient found, creating patient from input data')
            return await this.createPatient(patientJson)
        }
        // If local patient exists, return its id
        console.log('[REGISTRATION] Local patient found, returning id')
        return outputPatientInstance.id
    }

    createPatient = async (patientJson) => {
        console.log('[REGISTRATION] createPatient called')
        // FHIR liefert bereits eine id mit, sonst selbst eine vergeben
        if(!patientJson.id) {
            patientJson.id = randomUUID()
        }
        await this.dataBaseClient.addPatient(patientJson)
        return patientJson.id
    }
}

/**
 * Tiebreaker function, to filter out a unique patient, if several patients exist that share name and birthdate.
 * @param {*} listOfPatientInstances    The list of non unique patients, sharing at least name and birthdate.
 * @param {*} patientiToSearchFor       The patientJSON we got as the patient to register. 
 * @param {*} i                         An iterator, that is increased while going through the lsit of patients. Default is 0.
 * @returns                             One of the following: 
 *                                      - A unique patient 
 *                                      - Nothing in case no unique patient is found 
 *                                      - A recursive call of itself
 */
const tiebreak = (listOfPatientInstances, patientiToSearchFor, i = 0) => {
    console.log('[REGISTRATION]  started')
    if(listOfPatientInstances.length == 1) {
        console.log('[REGISTRATION TIEBREAKER] Unique patient found')
        return listOfPatientInstances[0]
    }
    if(i >= tiebreaker.length) {
        console.log('[REGISTRATION] Tiebreaker ran out of tiebreakers. No unique patient found')
        throw new AppError('[REGISTRATION TIEBREAKER] Ran out of tiebreakers. No unique patient found', 400)
    }

    const currentTiebreaker = tiebreaker[i]
    console.log('[REGISTRATION] Tiebreaker filtering by tiebreaker', currentTiebreaker)

    // The next line is a function, that removes the mongoose '_id' value from an attribute of
    // a patient instance, that mongoose has returned to us from the db.
    // To make it comparable to the attribute of the JSON from the patient we need to register.
    // Basicaly th function says "Turn this attribute and its content into a string except for the key '_id', that should be undefined."
    // Which in this case means, it does not exist anymore.
    const removeIdKeyFromMongoosePatientAttribute = (patientiInstance) => JSON.stringify(patientiInstance, (key, val) => key === '_id' ? undefined : val)

    // The next three lines filter out all the patient instances, 
    // that are equal to the to-be-registered-patient, regarding the tiebreaker.
    // Only these instances are left and kept in the listOfPatientInstances.
    const filteredlistOfPatientInstances = listOfPatientInstances.filter(
        patient => removeIdKeyFromPatientInstance(patient[currentTiebreaker]) === JSON.stringify(patientiToSearchFor[currentTiebreaker])
    )
    return tiebreak(filteredlistOfPatientInstances, patientiToSearchFor, i + 1)
}

export default PatientRegistration
