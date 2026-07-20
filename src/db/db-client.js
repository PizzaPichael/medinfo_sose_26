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
        try {
            return await Patient.find(filterAttributes).lean()  // .lean() → plain objects statt Mongoose-docs
        } 
        catch (e){
            console.log('[DB] Error getting patient by filter...', e)
            throw new AppError(`[DB] Error getting patient by filter... MongooseError: ${e}`, 500)
        }
    }

    getPatientByDbId = async (id) => {
        try {
            return await Patient.findById(id)  // z.B. '652f...'
        }
        catch (e){
            console.log('[DB] Error getting patient by db id...', e)
            throw new AppError(`[DB] Error getting patient by db id... MongooseError: ${e}`, 500)
        }
    }

    updatePatientById = async (id, patientSchemaInstance) => {
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
