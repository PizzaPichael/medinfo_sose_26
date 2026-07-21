import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildMongoFilter } from '../../src/db/db-client.js'

describe('buildMongoFilter', () => {
    it('maps FHIR search parameter names to their Mongo field paths', () => {
        const result = buildMongoFilter({ family: 'Ramirez', given: 'Carlos', birthdate: '1974-05-12' })

        assert.deepStrictEqual(result, {
            'name.family': 'Ramirez',
            'name.given': 'Carlos',
            'birthDate': '1974-05-12'
        })
    })

    it('maps address, identifier, telecom and language search parameters', () => {
        const result = buildMongoFilter({
            identifier: 'MRN-0001',
            telecom: '413-555-0100',
            'address-city': 'Springfield',
            'address-state': 'MA',
            'address-postalcode': '01109',
            'address-country': 'US',
            'address-use': 'home',
            language: 'en'
        })

        assert.deepStrictEqual(result, {
            'identifier.value': 'MRN-0001',
            'telecom.value': '413-555-0100',
            'address.city': 'Springfield',
            'address.state': 'MA',
            'address.postalCode': '01109',
            'address.country': 'US',
            'address.use': 'home',
            'communication.language.coding.code': 'en'
        })
    })

    it('passes through attributes without a mapping unchanged (e.g. gender, active)', () => {
        const result = buildMongoFilter({ gender: 'male', active: true })

        assert.deepStrictEqual(result, { gender: 'male', active: true })
    })
})
