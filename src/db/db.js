import mongoose from 'mongoose'
import Patient from './schemas/Patient.schema.js'

class DataBase {
    constructor(url) {
        this.url = url
        console.log('[DB] Connected...')
    }

    connect = async () => {
        try {
            await mongoose.connect(this.url)
        } catch (e) {
            console.log('[DB] Connected...', e);
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
        catch (e){
            console.log('[DB] Error getting patient by filter...', e)
        }
    }

    getPatientByDbId = async (id) => {
        try {
            return await Patient.findById(id)  // z.B. '652f...'
        }
        catch (e){
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
            if(result.matchedCount === 0) {
                console.log('[DB] No patient with this id found...')
            }
            return result
        } catch (e) {
            console.log('[DB] Error updating patient by id...', e)
        }
    }
}

export default DataBase
