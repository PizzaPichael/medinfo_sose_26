import test from 'node:test'
import assert from 'node:assert/strict'
import TreatmentDocumentationService from '../../src/Services/treatment-documentation-service.js'

test('createOpenEncounterTransaction - creates an in-progress encounter when patient exists and no open encounter exists', async () => {
  const created = []
  const service = new TreatmentDocumentationService(
    {
      getPatientByFilter: async () => [{ id: '123' }]
    },
    {
      getOpenEncountersForPatient: async () => ({ entry: [] }),
      createEncounter: async (encounter) => {
        created.push(encounter)
        return { ...encounter, id: 'enc-1' }
      }
    }
  )

  const result = await service.createOpenEncounterTransaction('123')

  assert.equal(result.id, 'enc-1')
  assert.equal(created[0].status, 'in-progress')
  assert.equal(created[0].subject.reference, 'Patient/123')
})

test('createOpenEncounterTransaction - rejects creating an encounter when another open encounter already exists', async () => {
  const service = new TreatmentDocumentationService(
    {
      getPatientByFilter: async () => [{ id: '123' }]
    },
    {
      getOpenEncountersForPatient: async () => ({ entry: [{ resource: { status: 'in-progress' } }] }),
      createEncounter: async () => {
        throw new Error('should not create encounter')
      }
    }
  )

  await assert.rejects(
    () => service.createOpenEncounterTransaction('123'),
    (error) => {
      assert.equal(error.statusCode, 409)
      return true
    }
  )
})
