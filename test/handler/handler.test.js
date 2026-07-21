import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import Handler from '../../src/handler/handler.js'
import AppError from '../../src/errors/AppError.js'
import auditEmitter from '../../src/audit/audit-emitter.js'

const fakeRes = () => {
    const res = {}
    res.statusCode = null
    res.jsonBody = null
    res.status = mock.fn((code) => { res.statusCode = code; return res })
    res.json = mock.fn((body) => { res.jsonBody = body; return res })
    return res
}

describe('Handler', () => {
    it('test() responds with 203 and a message', () => {
        const handler = new Handler({})
        const req = {}
        const res = fakeRes()

        handler.test(req, res)

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 203)
        assert.strictEqual(res.jsonBody.message, 'test Endpoint called')
    })

    it('registerPatient() responds with 200 and the patientId on success', async (t) => {
        const emit = t.mock.method(auditEmitter, 'emit')
        const registerPatient = mock.fn(async () => '12345')
        const handler = new Handler({ registerPatient })
        const req = { body: { id: '12345' } }
        const res = fakeRes()

        await handler.registerPatient(req, res)

        assert.strictEqual(registerPatient.mock.callCount(), 1)
        const [patientJson, transactionId] = registerPatient.mock.calls[0].arguments
        assert.strictEqual(patientJson, req.body)
        assert.strictEqual(typeof transactionId, 'string')
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200)
        assert.strictEqual(res.jsonBody.patientId, '12345')

        assert.strictEqual(emit.mock.callCount(), 1)
        const [eventName, payload] = emit.mock.calls[0].arguments
        assert.strictEqual(eventName, 'auditEvent')
        assert.strictEqual(payload.transactionId, transactionId)
        assert.strictEqual(payload.type, 'registerPatient')
        assert.strictEqual(payload.eventStatus, 200)
    })

    it('registerPatient() maps AppError statusCode to the response and audit event', async (t) => {
        const emit = t.mock.method(auditEmitter, 'emit')
        const registerPatient = mock.fn(async () => { throw new AppError('bad input', 400) })
        const handler = new Handler({ registerPatient })
        const req = { body: {} }
        const res = fakeRes()

        await handler.registerPatient(req, res)

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 400)
        assert.strictEqual(res.jsonBody.error, 'bad input')

        assert.strictEqual(emit.mock.callCount(), 1)
        const [, payload] = emit.mock.calls[0].arguments
        assert.strictEqual(payload.eventStatus, 400)
    })

    it('registerPatient() defaults to 500 for errors without a statusCode', async (t) => {
        const emit = t.mock.method(auditEmitter, 'emit')
        const registerPatient = mock.fn(async () => { throw new Error('boom') })
        const handler = new Handler({ registerPatient })
        const req = { body: {} }
        const res = fakeRes()

        await handler.registerPatient(req, res)

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 500)
        assert.strictEqual(res.jsonBody.error, 'boom')

        const [, payload] = emit.mock.calls[0].arguments
        assert.strictEqual(payload.eventStatus, 500)
    })

    it('createPatient() responds with 200 on success', async (t) => {
        const emit = t.mock.method(auditEmitter, 'emit')
        const createPatient = mock.fn(async () => '12345')
        const handler = new Handler({ createPatient })
        const req = { body: { id: '12345' } }
        const res = fakeRes()

        await handler.createPatient(req, res)

        assert.strictEqual(createPatient.mock.callCount(), 1)
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200)

        assert.strictEqual(emit.mock.callCount(), 1)
        const [, payload] = emit.mock.calls[0].arguments
        assert.strictEqual(payload.type, 'createPatient')
        assert.strictEqual(payload.eventStatus, 200)
    })

    it('createPatient() maps AppError statusCode to the response and audit event', async (t) => {
        const emit = t.mock.method(auditEmitter, 'emit')
        const createPatient = mock.fn(async () => { throw new AppError('db down', 503) })
        const handler = new Handler({ createPatient })
        const req = { body: {} }
        const res = fakeRes()

        await handler.createPatient(req, res)

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 503)
        assert.strictEqual(res.jsonBody.error, 'db down')

        const [, payload] = emit.mock.calls[0].arguments
        assert.strictEqual(payload.eventStatus, 503)
    })
})
