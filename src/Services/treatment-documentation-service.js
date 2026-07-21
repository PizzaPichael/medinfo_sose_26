import AppError from '../errors/AppError.js'

class TreatmentDocumentationService {
    constructor(localDbClient, fhirClient) {
        this.localDbClient = localDbClient
        this.fhirClient = fhirClient
    }


    createOpenEncounterTransaction = async (patientId) => {
        const patient = await this.localDbClient.getPatientByFilter({ id: patientId });
        if (!patient || patient.length === 0) {
            throw new AppError(`Patient ${patientId} not found in local database.`, 404);
        }

        const existingEncounters = await this.fhirClient.getOpenEncountersForPatient(patientId);

        const hasInProgressEncounter = (existingEncounters?.entry || []).some((entry) => {
            const status = entry?.resource?.status;
            return status === 'in-progress';
        });

        if (hasInProgressEncounter) {
            throw new AppError(
                `Patient ${patientId} already has an in-progress encounter.`,
                409
            );
        }

        const encounter = {
            resourceType: 'Encounter',
            status: 'in-progress',
            subject: {
                reference: `Patient/${patientId}`,
            },
            period: {
                start: new Date().toISOString(),
            },
        };

        return await this.fhirClient.createEncounter(encounter);
    };

}

export default TreatmentDocumentationService
