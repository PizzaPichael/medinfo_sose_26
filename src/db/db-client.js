import mongoose from 'mongoose'
import Patient from './schemas/Patient.schema.js'
import Consent from './schemas/Consent.schema.js'
import Condition from './schemas/Condition.schema.js'
import MedicationStatement from './schemas/MedicationStatement.schema.js'
import AppError from '../errors/AppError.js'

/**
 * Übersetzt FHIR-Suchparameter-Namen in die lokalen Mongo-Feldpfade.
 * Attribute ohne Eintrag werden unverändert als Feldname übernommen (z.B. gender, active).
 */
const fhirToMongoField = {
    family: 'name.family',
    given: 'name.given',
    birthdate: 'birthDate',
    identifier: 'identifier.value',
    telecom: 'telecom.value',
    'address-use': 'address.use',
    'address-city': 'address.city',
    'address-state': 'address.state',
    'address-postalcode': 'address.postalCode',
    'address-country': 'address.country',
    language: 'communication.language.coding.code'
}

/**
 * Baut einen Mongo-Filter aus FHIR-Suchparameter-Namen, via fhirToMongoField.
 * @param {Object} filterAttributes - Key-Value-Paare als FHIR-Suchparameter, z.B. { family: 'Ramirez', birthdate: '1974-05-12' }.
 * @returns {Object} Filter-Objekt mit Mongo-Feldpfaden als Keys, z.B. { 'name.family': 'Ramirez', birthDate: '1974-05-12' }.
 */
export const buildMongoFilter = (filterAttributes) => {
    const mongoFilter = {}
    for (const [key, value] of Object.entries(filterAttributes)) {
        mongoFilter[fhirToMongoField[key] ?? key] = value
    }
    return mongoFilter
}

/**
 * Client für Zugriff auf die lokale MongoDB (Suche und Anlegen/Aktualisieren von Patient-Dokumenten).
 */
class DataBaseClient {
    /**
     * @param {string} url - Mongo-Connection-String, z.B. 'mongodb://localhost:27017/docAndProcedures'.
     */
    constructor(url) {
        this.url = url
        console.log('[DB] DB-Client created...')
    }

    /**
     * Baut die Mongoose-Verbindung zur konfigurierten URL auf.
     * @returns {Promise<void>}
     */
    connect = async () => {
        try {
            await mongoose.connect(this.url)
            console.log('[DB] Connected...')
        } catch (e) {
            console.log('[DB] Connection failed...', e);
            throw new AppError(`[DB] Connection failed... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Trennt die Mongoose-Verbindung.
     * @returns {Promise<void>}
     */
    endConnection = async () => {
        await mongoose.disconnect()
        console.log('[DB] Disconnected...')
    }

    /**
     * Legt ein neues Patient-Dokument in der lokalen DB an.
     * @param {Object} schemaInstance - Patient-Objekt nach dem Patient-Schema.
     * @returns {Promise<void>}
     */
    addPatient = async (schemaInstance) => {
        console.log('[DB] addPatient called')
        try {
            const patient = new Patient(schemaInstance)
            await patient.save()
            console.log('[DB] Patient created...')
        } catch (e) {
            console.log('[DB] Something went wrong creating a patient...', e)
            throw new AppError(`[DB] Something went wrong creating a patient... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Sucht Patient-Dokumente in der lokalen DB anhand FHIR-benannter Suchparameter.
     * @param {Object} filterAttributes - Key-Value-Paare als FHIR-Suchparameter, z.B. { family: 'Ramirez', birthdate: '1974-05-12' }.
     * @returns {Promise<Object[]>} Array mit gefundenen Patienten-Dokumenten (leer, falls keins passt).
     */
    getPatientByFilter = async (filterAttributes) => {
        console.log('[DB] getPatientByFilter called')
        try {
            const mongoFilter = buildMongoFilter(filterAttributes)
            const result = await Patient.find(mongoFilter).lean()  // .lean() → plain objects statt Mongoose-docs
            console.log(result.length != 0 ? '[DB] Patient found' : '[DB] Patient not found')
            return result
        }
        catch (e){
            console.log('[DB] Error getting patient by filter...', e)
            throw new AppError(`[DB] Error getting patient by filter... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Retrieves a consent by consent ID from the database
     * DB Client responsibility: Handle all database operations
     * 
     * @param {string} id - Consent ID to retrieve
     * @returns {Object} The consent document or null if not found
     * @throws {Error} If database operation fails
     */
    getConsentById = async (id) => {
        try {
            return await Consent.findOne({ consentId: id })
        } catch (e) {
            console.error('[DB] Error getting consent by ID...', e)
            throw new Error(`Database error: ${e.message}`)
        }
    }

    /**
     * Retrieves consents by patient ID from the database
     * DB Client responsibility: Handle all database operations
     * 
     * @param {string} patientId - Patient ID to retrieve consents for
     * @returns {Array} Array of consent documents for the patient
     * @throws {Error} If database operation fails
     */
    getConsentByPatientId = async (patientId) => {
        try {
            return await Consent.findOne({ 'subject.reference': `Patient/${patientId}` }).lean()
        } catch (e) {
            console.error('[DB] Error getting consent by patient ID...', e)
            throw new Error(`Database error: ${e.message}`)
        }
    }

    /**
     * Legt ein neues Condition-Dokument in der lokalen DB an.
     * @param {Object} schemaInstance - Condition-Objekt nach dem Condition-Schema.
     * @returns {Promise<void>}
     */
    addCondition = async (schemaInstance) => {
        console.log('[DB] addCondition called')
        try {
            const condition = new Condition(schemaInstance)
            await condition.save()
            console.log('[DB] Condition created...')
        } catch (e) {
            console.log('[DB] Something went wrong creating a condition...', e)
            throw new AppError(`[DB] Something went wrong creating a condition... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Legt ein neues MedicationStatement-Dokument in der lokalen DB an.
     * @param {Object} schemaInstance - MedicationStatement-Objekt nach dem MedicationStatement-Schema.
     * @returns {Promise<void>}
     */
    addMedicationStatement = async (schemaInstance) => {
        console.log('[DB] addMedicationStatement called')
        try {
            const medicationStatement = new MedicationStatement(schemaInstance)
            await medicationStatement.save()
            console.log('[DB] MedicationStatement created...')
        } catch (e) {
            console.log('[DB] Something went wrong creating a medication statement...', e)
            throw new AppError(`[DB] Something went wrong creating a medication statement... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Sucht alle Condition-Dokumente einer Patient:in in der lokalen DB.
     * @param {string} patientId - Die lokale Patient-id (ohne 'Patient/'-Präfix).
     * @returns {Promise<Object[]>} Array mit gefundenen Conditions (leer, falls keine existieren).
     */
    getConditionsByPatientId = async (patientId) => {
        console.log('[DB] getConditionsByPatientId called')
        try {
            return await Condition.find({ 'subject.reference': `Patient/${patientId}` }).lean()
        } catch (e) {
            console.log('[DB] Error getting conditions by patient ID...', e)
            throw new AppError(`[DB] Error getting conditions by patient ID... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Sucht alle MedicationStatement-Dokumente einer Patient:in in der lokalen DB.
     * @param {string} patientId - Die lokale Patient-id (ohne 'Patient/'-Präfix).
     * @returns {Promise<Object[]>} Array mit gefundenen MedicationStatements (leer, falls keine existieren).
     */
    getMedicationStatementsByPatientId = async (patientId) => {
        console.log('[DB] getMedicationStatementsByPatientId called')
        try {
            return await MedicationStatement.find({ 'subject.reference': `Patient/${patientId}` }).lean()
        } catch (e) {
            console.log('[DB] Error getting medication statements by patient ID...', e)
            throw new AppError(`[DB] Error getting medication statements by patient ID... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Saves a consent schema instance to the database
     * DB Client responsibility: Handle all database operations
     *
     * @param {Object} schemaInstance - Consent object matching Consent schema
     * @returns {Object} The created consent document
     * @throws {Error} If database operation fails
     */
    saveConsent = async (schemaInstance) => {
        try {
            const consent = new Consent(schemaInstance)
            const savedConsent = await consent.save()
            console.log('[DB] Consent created...')
            return savedConsent
        } catch (e) {
            console.error('[DB] Something went wrong creating consent...', e)
            throw new Error(`Database error: ${e.message}`)
        }
    }
}

export default DataBaseClient
