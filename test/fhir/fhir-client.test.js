import { describe, it } from 'node:test'
import assert from 'node:assert'
import FhirClient from '../../src/fhir/fhir-client.js'
import AppError from '../../src/errors/AppError.js'

const fakeFetchResponse = ({ ok = true, status = 200, json }) => ({
    ok,
    status,
    json: async () => json
})

describe('FhirClient', () => {
    describe('getPatientByFilter', () => {
        it('returns an empty array when the FHIR server reports total 0', async (t) => {
            t.mock.method(globalThis, 'fetch', async () => fakeFetchResponse({ json: { total: 0 } }))
            const client = new FhirClient('https://fhir.example.org')

            const result = await client.getPatientByFilter({ family: 'Ramirez' })

            assert.deepStrictEqual(result, [])
        })

        it('strips the meta key from every returned resource', async (t) => {
            const resource = { resourceType: 'Patient', id: 'patient-1', name: [{ family: 'Ramirez' }], meta: { versionId: '1' } }
            t.mock.method(globalThis, 'fetch', async () => fakeFetchResponse({
                json: { total: 1, entry: [{ resource }] }
            }))
            const client = new FhirClient('https://fhir.example.org')

            const result = await client.getPatientByFilter({ family: 'Ramirez' })

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].meta, undefined)
            assert.strictEqual(result[0].id, 'patient-1')
        })

        it('throws an AppError with the FHIR status when the request fails', async (t) => {
            t.mock.method(globalThis, 'fetch', async () => fakeFetchResponse({ ok: false, status: 400, json: {} }))
            const client = new FhirClient('https://fhir.example.org')

            await assert.rejects(
                () => client.getPatientByFilter({ family: 'Ramirez' }),
                (e) => e instanceof AppError && e.statusCode === 400
            )
        })
    })
})
