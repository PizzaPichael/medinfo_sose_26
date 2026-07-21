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

    createProcedureTransaction = async (patientId, procedureData = {}) => {
        const resolvedPatientId = patientId || this.#extractPatientIdFromReference(procedureData?.subject?.reference);

        if (!resolvedPatientId) {
            throw new AppError('patientId is required.', 400);
        }

        const patient = await this.localDbClient.getPatientByFilter({ id: resolvedPatientId });
        if (!patient || patient.length === 0) {
            throw new AppError(`Patient ${resolvedPatientId} not found in local database.`, 404);
        }

        const encounterReference = procedureData?.encounter?.reference || procedureData?.encounter;
        const encounterId = this.#extractResourceIdFromReference(encounterReference, 'Encounter');

        if (!encounterId) {
            throw new AppError('Encounter reference is required.', 400);
        }

        const encounter = await this.fhirClient.getEncounterById(encounterId);
        if (!encounter || encounter.resourceType !== 'Encounter') {
            throw new AppError(`Encounter ${encounterId} not found in FHIR server.`, 404);
        }

        if (encounter.status !== 'in-progress') {
            throw new AppError(`Encounter ${encounterId} is not in-progress.`, 409);
        }

        const procedure = {
            resourceType: 'Procedure',
            status: 'completed',
            subject: {
                reference: `Patient/${resolvedPatientId}`,
            },
            encounter: {
                reference: `Encounter/${encounterId}`,
            },
            ...procedureData,
            code: procedureData.code || { text: 'Procedure' },
        };

        return await this.fhirClient.createProcedure(procedure);
    };

    #extractPatientIdFromReference = (reference) => this.#extractResourceIdFromReference(reference, 'Patient');

    #extractResourceIdFromReference = (reference, expectedResourceType) => {
        if (!reference) {
            return null;
        }

        if (typeof reference === 'string') {
            const [resourceType, resourceId] = reference.split('/');
            if (resourceType === expectedResourceType && resourceId) {
                return resourceId;
            }
            return null;
        }

        if (typeof reference === 'object') {
            const refValue = reference.reference || reference.id;
            if (!refValue) {
                return null;
            }
            const [resourceType, resourceId] = refValue.split('/');
            if (resourceType === expectedResourceType && resourceId) {
                return resourceId;
            }
        }

        return null;
    };
}

export default TreatmentDocumentationService
