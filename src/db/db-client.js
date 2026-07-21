import mongoose from 'mongoose'
import Patient from './schemas/Patient.schema.js'
import AppError from '../errors/AppError.js'

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
            throw new AppError(`[DB] Connection failed... MongooseError: ${e}`, 500)
        }
    }

    endConnection = async () => {
        await mongoose.disconnect()
        console.log('[DB] Disconnected...')
    }
    
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

    getPatientByFilter = async (filterAttributes) => {
        console.log('[DB] getPatientByFilter called')
        try {
            // Übersetzt FHIR-Suchparameter-Namen in die lokalen Mongo-Feldpfade.
            // Attribute ohne Eintrag werden unverändert als Feldname übernommen (z.B. gender, active).
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
            const mongoFilter = {}
            for (const [key, value] of Object.entries(filterAttributes)) {
                mongoFilter[fhirToMongoField[key] ?? key] = value
            }
            const result = await Patient.find(mongoFilter).lean()  // .lean() → plain objects statt Mongoose-docs
            console.log(result.length != 0 ? '[DB] Patient found' : '[DB] Patient not found')
            return result
        }
        catch (e){
            console.log('[DB] Error getting patient by filter...', e)
            throw new AppError(`[DB] Error getting patient by filter... MongooseError: ${e}`, 500)
        }
    }

    getPatientByDbId = async (id) => {
        console.log('[DB] getPatientByDbId called')
        try {
            return await Patient.findById(id)  // z.B. '652f...'
        }
        catch (e){
            console.log('[DB] Error getting patient by db id...', e)
            throw new AppError(`[DB] Error getting patient by db id... MongooseError: ${e}`, 500)
        }
    }

    updatePatientById = async (id, patientSchemaInstance) => {
        console.log('[DB] updatePatientById called')
        try {
           const result = await Patient.updateOne(
                { id: id },
                { $set: patientSchemaInstance }
            )
            if(result.matchedCount === 0) {
                console.log('[DB] No patient with this id found...')
                throw new AppError('[DB] No patient with this id found', 404)
            }
            return result
        } catch (e) {
            console.log('[DB] Error updating patient by id...', e)
            if (e instanceof AppError) throw e
            throw new AppError(`[DB] Error updating patient by id... MongooseError: ${e}`, 500)
        }
    }
}

export default DataBaseClient
