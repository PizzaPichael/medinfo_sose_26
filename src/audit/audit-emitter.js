import { EventEmitter } from 'node:events'

/**
 * Gemeinsames EventEmitter Objekt für das Audit-System (Observer-Pattern).
 * Würden alle Services separat EventEmitter von node:events importieren, würde jeder Service separate Emitter aufrufen.
 * Handler, Services, etc. erstellen 'auditEvent'-Events, ohne seine Beobachter zu kennen.
 * AuditClient abonniert sich darauf, um Events zu persistieren.
 */
export default new EventEmitter()
