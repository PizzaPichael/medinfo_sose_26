import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { writeFile, access } from 'node:fs/promises'
import { appendEvent, appendEvents, readPendingEvents, rotateQueue, deleteFile } from '../../src/audit/audit-disk-queue.js'

const exists = async (filePath) => {
    try {
        await access(filePath)
        return true
    } catch {
        return false
    }
}

describe('audit-disk-queue', () => {
    let filePath

    beforeEach(() => {
        filePath = path.join(tmpdir(), `audit-queue-test-${randomUUID()}.ndjson`)
    })

    afterEach(async () => {
        await deleteFile(filePath)
        await deleteFile(filePath + '.processing')
    })

    it('appendEvent writes events as ordered NDJSON lines', async () => {
        await appendEvent(filePath, { type: 'a' })
        await appendEvent(filePath, { type: 'b' })

        const { events, malformedLines } = await readPendingEvents(filePath)

        assert.deepStrictEqual(events, [{ type: 'a' }, { type: 'b' }])
        assert.strictEqual(malformedLines, 0)
    })

    it('appendEvents writes multiple events in order', async () => {
        await appendEvents(filePath, [{ type: 'a' }, { type: 'b' }, { type: 'c' }])

        const { events } = await readPendingEvents(filePath)

        assert.deepStrictEqual(events, [{ type: 'a' }, { type: 'b' }, { type: 'c' }])
    })

    it('readPendingEvents returns an empty result for a missing file', async () => {
        const result = await readPendingEvents(filePath)

        assert.deepStrictEqual(result, { events: [], malformedLines: 0 })
    })

    it('readPendingEvents skips malformed lines and counts them', async () => {
        await writeFile(filePath, '{"type":"a"}\nnot-json\n{"type":"b"}\n')

        const { events, malformedLines } = await readPendingEvents(filePath)

        assert.deepStrictEqual(events, [{ type: 'a' }, { type: 'b' }])
        assert.strictEqual(malformedLines, 1)
    })

    it('rotateQueue returns null when there is nothing to rotate', async () => {
        const result = await rotateQueue(filePath)

        assert.strictEqual(result, null)
    })

    it('rotateQueue renames the live file to a .processing path', async () => {
        await appendEvent(filePath, { type: 'a' })

        const processingPath = await rotateQueue(filePath)

        assert.strictEqual(processingPath, filePath + '.processing')
        assert.strictEqual(await exists(filePath), false)
        assert.strictEqual(await exists(processingPath), true)
    })

    it('deleteFile removes an existing file and swallows a missing one', async () => {
        await appendEvent(filePath, { type: 'a' })

        await deleteFile(filePath)
        assert.strictEqual(await exists(filePath), false)

        await assert.doesNotReject(() => deleteFile(filePath))
    })
})
