import mongoose from 'mongoose'
import Patient from './schemas/Patient.schema.js'
import Consent from './schemas/Consent.schema.js'

class DataBaseClient {
    constructor(url) {
        this.url = url
        console.log('[DB] DB-Client created...')
    }

    connect = async () => {
        try {
            await mongoose.connect(this.url)
            console.log('[DB] Connected...')
        } catch (e) {
            console.log('[DB] Connection failed...', e);
        }
    }

    endConnection = async () => {
        await mongoose.disconnect()
        console.log('[DB] Disconnected...')
    }

    addPatient = async (schemaInstance) => {
        try {
            const patient = new Patient(schemaInstance)
            await patient.save()
            console.log('[DB] Patient created...')
        } catch (e) {
            console.log('[DB] Something went wrong creating a patient...', e)
        }
    }

    getAllPatients = async () => {
        try {
            return await Patient.find()
        }
        catch (e) {
            console.log('[DB] Error getting all patients...', e)
        }
    }

    getPatientByFilter = async (filter) => {
        try {
            return await Patient.find(filter)  // z.B. { gender: 'male' }
        }
        catch (e) {
            console.log('[DB] Error getting patient by filter...', e)
        }
    }

    getPatientByDbId = async (id) => {
        try {
            return await Patient.findById(id)  // z.B. '652f...'
        }
        catch (e) {
            console.log('[DB] Error getting patient by db id...', e)
        }
    }
    updatePatientById
    updatePatientById = async (id, patientSchemaInstance) => {
        try {
            const result = await Patient.updateOne(
                { id: id },
                { $set: patientSchemaInstance }
            )
            if (result.matchedCount === 0) {
                console.log('[DB] No patient with this id found...')
            }
            return result
        } catch (e) {
            console.log('[DB] Error updating patient by id...', e)
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
            return await Consent.findOne({ 'subject.reference': `Patient/${patientId}` })
        } catch (e) {
            console.error('[DB] Error getting consent by patient ID...', e)
            throw new Error(`Database error: ${e.message}`)
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
