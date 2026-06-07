const mongoose = require('mongoose')
const patientSchema = require('./schemas/Patient.schema')

const Patient = mongoose.model('Patient', patientSchema)

class DataBase {
    constructor(url) {
        this.url = url
        console.log('[DB] Connected...')
    }

    connect = async (url) => {
        try {
            await mongoose.connect(url)
        } catch {
            console.log('[DB] Connected...');
        }
    }

    endConnection = async () => {
        await mongoose.disconnect()
        console.log('[DB] Disconnected...')
    }
    
    addPatient = async (schemaInstance) => {
        try {
            patient = new Patient(schemaInstance)
            await patient.save()
            console.log('[DB] Patient created...')
        } catch {
            console.log('[DB] Something went wrong creating a patient...')
        }
    }

    getAllPatients = async () => {
        try {
            return await Patient.find()
        }
        catch {
            console.log('[DB] Error getting all patients...')
        }
    }

    getPatientByFilter = async (filter) => {
        try {
            return await Patient.find(filter)  // z.B. { gender: 'male' }
        } 
        catch {
            console.log('[DB] Error getting patient by fitler...')
        }
    }

    getPatientByDbId = async (id) => {
        try {
            return await Patient.findById(id)  // z.B. '652f...'
        }
        catch {
            console.log('[DB] Error getting patient by db id...')
        }
    }
}

module.exports = DataBase;
