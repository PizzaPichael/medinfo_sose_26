import AppError from '../errors/AppError.js'

class TreatmentDocumentationService {
    constructor(localDbClient, fhirClient) {
        this.localDbClient = localDbClient
        this.fhirClient = fhirClient
    }

    createOpenEncounterTransaction = async (patientId) => {
        /*const patients = await this.localDbClient.getPatientByFilter({ id: patientId })
        if (!patients || patients.length === 0) {
            throw new AppError(`[TREATMENT] Patient ${patientId} does not exist in local DB.`, 404)
        }*/

        const existingEncounters = await this.fhirClient.getOpenEncountersForPatient(patientId)
        const hasInProgressEncounter = (existingEncounters?.entry || []).some((entry) => {
            const status = entry?.resource?.status
            return status === 'in-progress'
        })

        if (hasInProgressEncounter) {
            throw new AppError(`[TREATMENT] Patient ${patientId} already has an in-progress encounter.`, 409)
        }

        const encounter = {
            resourceType: 'Encounter',
            status: 'in-progress',
            subject: {
                reference: `Patient/${patientId}`
            },
            period: {
                start: new Date().toISOString()
            }
        }

        return await this.fhirClient.createEncounter(encounter)
    }
}

export default TreatmentDocumentationService
