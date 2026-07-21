import mongoose from 'mongoose'
import Patient from './schemas/Patient.schema.js'
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
        } catch (e){
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
}

export default DataBaseClient
