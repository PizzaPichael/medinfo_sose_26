import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { unlink } from 'node:fs/promises'
import AuditClient from '../../src/util/audit-client.js'
import { readPendingEvents } from '../../src/audit/audit-disk-queue.js'

describe('AuditClient', () => {
    let queueFilePath

    beforeEach(() => {
        queueFilePath = path.join(tmpdir(), `audit-client-test-${randomUUID()}.ndjson`)
    })

    afterEach(async () => {
        try { await unlink(queueFilePath) } catch {}
        try { await unlink(queueFilePath + '.processing') } catch {}
    })

    it('recordEvent falls back to the disk queue when not connected, without throwing', async () => {
        const emitter = new EventEmitter()
        const client = new AuditClient('mongodb://unused', emitter, { queueFilePath })
        const payload = { transactionId: 'tx-1', timestamp: new Date().toISOString(), type: 'registerPatient', eventStatus: 200 }

        await assert.doesNotReject(() => client.recordEvent(payload))

        const { events } = await readPendingEvents(queueFilePath)
        assert.deepStrictEqual(events, [payload])
    })

    it('emitting an auditEvent on the injected emitter is not observed before connect() subscribes', async () => {
        const emitter = new EventEmitter()
        new AuditClient('mongodb://unused', emitter, { queueFilePath })

        assert.strictEqual(emitter.listenerCount('auditEvent'), 0)
    })
})
