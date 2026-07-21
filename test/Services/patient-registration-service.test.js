import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import PatientRegistration from '../../src/Services/patient-registration-service.js'
import auditEmitter from '../../src/audit/audit-emitter.js'

describe('PatientRegistration', () => {
    it('Successfully registers a patient which is unknown to fhir and local.', async () => {
        const getPatientByFilterLocal = mock.fn(async () => [])
        const getPatientByFilterFhir = mock.fn(async () => [])
        const addPatient = mock.fn(async (patient) => patient)
        // Fhir server assigns its own id on create, the local copy has to carry that id
        const createPatientFhir = mock.fn(async (patient) => ({ ...patient, id: 'fhir-assigned-1' }))
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir, createPatient: createPatientFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)
        const patientJson = { name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(getPatientByFilterLocal.mock.callCount(), 1)
        assert.strictEqual(getPatientByFilterFhir.mock.callCount(), 1)
        assert.strictEqual(createPatientFhir.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.calls[0].arguments[0].id, 'fhir-assigned-1')
        assert.equal(registratioSuccessfullId, 'fhir-assigned-1')
    })

    it('Successfully register a patient that is known to the local db and pushes it to fhir.', async () => {
        const id = '12345'
        const patientJson = { id: id, name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }
        // Lokale Instanz aus mongoose enthält _id-Metadaten, die nicht an fhir gehen dürfen
        const localPatientInstance = { ...patientJson, _id: 'mongo-object-id', __v: 0 }
        const getPatientByFilterLocal = mock.fn(async (patient) => [localPatientInstance])
        const getPatientByFilterFhir = mock.fn(async () => [])
        const addPatient = mock.fn(async (patient) => patient)
        const createPatientFhir = mock.fn(async (patient) => ({ ...patient, id: 'fhir-assigned-1' }))
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir, createPatient: createPatientFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(getPatientByFilterLocal.mock.callCount(), 1)
        assert.strictEqual(getPatientByFilterFhir.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.callCount(), 0)
        assert.strictEqual(createPatientFhir.mock.callCount(), 1)
        assert.deepStrictEqual(createPatientFhir.mock.calls[0].arguments[0], patientJson)
        assert.equal(registratioSuccessfullId, id)
    })

    it('Creates a local patient from the FHIR instance when only FHIR knows the patient.', async () => {
        const patientJson = { name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }
        const fhirPatientJson = { id: 'fhir-99', name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }
        const getPatientByFilterLocal = mock.fn(async () => [])
        const getPatientByFilterFhir = mock.fn(async () => [fhirPatientJson])
        const addPatient = mock.fn(async (patient) => patient)
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(getPatientByFilterLocal.mock.callCount(), 1)
        assert.strictEqual(getPatientByFilterFhir.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.calls[0].arguments[0], fhirPatientJson)
        assert.equal(registratioSuccessfullId, 'fhir-99')
    })

    it('Resolves multiple local matches via the tiebreaker attributes.', async () => {
        const patientJson = {
            name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }],
            birthDate: '1974-05-12',
            address: { city: 'Springfield' }
        }
        const candidateA = { id: 'A', name: patientJson.name, birthDate: patientJson.birthDate, address: { city: 'Springfield' } }
        const candidateB = { id: 'B', name: patientJson.name, birthDate: patientJson.birthDate, address: { city: 'Boston' } }
        const getPatientByFilterLocal = mock.fn(async () => [candidateA, candidateB])
        const getPatientByFilterFhir = mock.fn(async () => [])
        const addPatient = mock.fn(async (patient) => patient)
        const createPatientFhir = mock.fn(async (patient) => ({ ...patient, id: 'fhir-assigned-1' }))
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir, createPatient: createPatientFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(addPatient.mock.callCount(), 0)
        assert.equal(registratioSuccessfullId, 'A')
    })

    it('Emits localSearch, fhirSearch, fhirPatientCreated and patientCreated audit events with the same transactionId.', async (t) => {
        const emit = t.mock.method(auditEmitter, 'emit')
        const getPatientByFilterLocal = mock.fn(async () => [])
        const getPatientByFilterFhir = mock.fn(async () => [])
        const addPatient = mock.fn(async (patient) => patient)
        const createPatientFhir = mock.fn(async (patient) => ({ ...patient, id: 'fhir-assigned-1' }))
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir, createPatient: createPatientFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)
        const patientJson = { name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }
        const transactionId = 'tx-42'

        await service.registerPatient(patientJson, transactionId)

        const emittedTypes = emit.mock.calls.map(call => call.arguments[1].type)
        assert.deepStrictEqual(emittedTypes, ['localSearch', 'fhirSearch', 'fhirPatientCreated', 'patientCreated'])
        for (const call of emit.mock.calls) {
            assert.strictEqual(call.arguments[0], 'auditEvent')
            assert.strictEqual(call.arguments[1].transactionId, transactionId)
        }
    })

})
