import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import PatientRegistration from '../../src/Services/patient-registration-service.js'

describe('PatientRegistration', () => {
    it('Successfully registers a patient which is unknown to fhir and local.', async () => {
        const getPatientByFilterLocal = mock.fn(async () => [])
        const getPatientByFilterFhir = mock.fn(async () => [])
        const addPatient = mock.fn(async (patient) => patient)
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)
        const id = "12345"
        const patientJson = { id: id, name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(getPatientByFilterLocal.mock.callCount(), 1)
        assert.strictEqual(getPatientByFilterFhir.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.callCount(), 1)
        assert.equal(registratioSuccessfullId, id)
    })

    it('Successfully register a patient that is known to the local db.', async () => {
        const id = '12345'
        const patientJson = { id: id, name: [{ use: 'official', family: 'Ramirez', given: ['Carlos'] }], birthDate: '1974-05-12' }
        const getPatientByFilterLocal = mock.fn(async (patient) => [patientJson])
        const getPatientByFilterFhir = mock.fn(async () => [])
        const addPatient = mock.fn(async (patient) => patient)
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(getPatientByFilterLocal.mock.callCount(), 1)
        assert.strictEqual(getPatientByFilterFhir.mock.callCount(), 1)
        assert.strictEqual(addPatient.mock.callCount(), 0)
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
        const fakeDbClient = { addPatient, getPatientByFilter: getPatientByFilterLocal }
        const fakeFhirClient = { getPatientByFilter: getPatientByFilterFhir }
        const service = new PatientRegistration(fakeDbClient, fakeFhirClient)

        const registratioSuccessfullId = await service.registerPatient(patientJson)

        assert.strictEqual(addPatient.mock.callCount(), 0)
        assert.equal(registratioSuccessfullId, 'A')
    })

})
