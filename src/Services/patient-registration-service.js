import { randomUUID } from 'node:crypto'
import AppError from '../errors/AppError.js'
import auditEmitter from '../audit/audit-emitter.js'

const tiebreaker = ['maritalStatus', 'address', 'telecom']

/**
 * Service zur Registrierung von Patienten am Empfang: prüft lokale DB und FHIR-Server auf existierende
 * Patienten und legt bei Bedarf einen neuen lokalen Patienten an.
 */
class PatientRegistration {

    /**
     * @param {*} localDbClient - Client für Zugriff auf die lokale DB (implementiert getPatientByFilter, addPatient).
     * @param {*} fhirClient - Client für Zugriff auf den FHIR-Server (implementiert getPatientByFilter).
     */
    constructor(localDbClient, fhirClient) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        console.log('[PATIENT-REGISTRATION] Created...')
    }

    /**
     * Sucht einen Patienten anhand seines offiziellen Namens und Geburtsdatums bei einem gegebenen Client.
     * Bei mehreren Treffern wird der eindeutige Patient über tiebreak() ermittelt.
     * @param {*} dbClient - Client (lokale DB oder FHIR), der getPatientByFilter implementiert.
     * @param {*} patientJson - Der zu registrierende Patient, muss ein name-Element mit use 'official' enthalten.
     * @param {string} transactionId - Korreliert das emittierte Audit-Sub-Event mit der übergeordneten Transaktion.
     * @param {string} sourceLabel - Bezeichnung der Quelle für das Audit-Event, z.B. 'localSearch' oder 'fhirSearch'.
     * @returns {Promise<Object|null>} Der gefundene Patient oder null, falls keiner existiert.
     */
    getPatientFromDb = async (dbClient, patientJson, transactionId, sourceLabel) => {
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
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: sourceLabel, eventStatus: 200 })
            return wantedPatientInstance
        }
        console.log(`[REGISTRATION] No patient found.`)
        auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: sourceLabel, eventStatus: 200 })
        return null
    }

    /**
     * Registriert einen Patienten: sucht ihn zuerst lokal und in FHIR; existiert er lokal, wird nur seine id
     * zurückgegeben; existiert er nur in FHIR, wird er lokal übernommen; existiert er nirgends, wird er neu angelegt.
     * @param {*} patientJson - Der zu registrierende Patient, muss ein name-Element mit use 'official' enthalten.
     * @param {string} transactionId - Korreliert alle Audit-Events dieser Registrierung.
     * @returns {Promise<string>} Die (lokale) id des registrierten Patienten.
     */
    registerPatient = async (patientJson, transactionId) => {
        console.log('[REGISTRATION] registerPatient called')
        const wantedLocalPatientInstance = await this.getPatientFromDb(this.dataBaseClient, patientJson, transactionId, 'localSearch')
        const wantedFhirPatientInstance = await this.getPatientFromDb(this.fhirClient, patientJson, transactionId, 'fhirSearch')

        let outputPatientInstance = wantedLocalPatientInstance
        // If no local patient exist, but fhir patient exists, create locla patient from fhir
        if(!outputPatientInstance && wantedFhirPatientInstance) {
            console.log('[REGISTRATION] No local patient found, creating patient from fhir')
            return await this.createPatient(wantedFhirPatientInstance, transactionId)
        }

        // If neither local, nor fhir patient exist, create new local patient from input data
        if(!outputPatientInstance && !wantedLocalPatientInstance && !wantedFhirPatientInstance) {
            console.log('[REGISTRATION] No local or fhir patient found, creating patient from input data')
            return await this.createPatient(patientJson, transactionId)
        }
        // If local patient exists, return its id
        console.log('[REGISTRATION] Local patient found, returning id')
        return outputPatientInstance.id
    }

    /**
     * Legt einen Patienten in der lokalen DB an. Vergibt eine neue id, falls noch keine vorhanden ist
     * (z.B. FHIR liefert bereits eine id mit, ein neu erfasster Patient noch nicht).
     * @param {*} patientJson - Der anzulegende Patient.
     * @param {string} transactionId - Korreliert das emittierte Audit-Event mit der übergeordneten Transaktion.
     * @returns {Promise<string>} Die id des angelegten Patienten.
     */
    createPatient = async (patientJson, transactionId) => {
        console.log('[REGISTRATION] createPatient called')
        // FHIR liefert bereits eine id mit, sonst selbst eine vergeben
        if(!patientJson.id) {
            patientJson.id = randomUUID()
        }
        await this.dataBaseClient.addPatient(patientJson)
        auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'patientCreated', eventStatus: 200 })
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
        patient => removeIdKeyFromMongoosePatientAttribute(patient[currentTiebreaker]) === JSON.stringify(patientiToSearchFor[currentTiebreaker])
    )
    return tiebreak(filteredlistOfPatientInstances, patientiToSearchFor, i + 1)
}

export default PatientRegistration
