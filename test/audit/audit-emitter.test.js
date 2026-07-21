import { describe, it } from 'node:test'
import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import auditEmitter from '../../src/audit/audit-emitter.js'
import auditEmitterAgain from '../../src/audit/audit-emitter.js'

describe('audit-emitter', () => {
    it('exports an EventEmitter instance', () => {
        assert.ok(auditEmitter instanceof EventEmitter)
    })

    it('exports the same instance on every import (shared bus)', () => {
        assert.strictEqual(auditEmitter, auditEmitterAgain)
    })
})
