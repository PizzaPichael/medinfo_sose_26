import mongoose from 'mongoose'
import AppError from '../errors/AppError.js'
import auditEventSchema from '../audit/schemas/AuditEvent.schema.js'
import counterSchema from '../audit/schemas/Counter.schema.js'
import { appendEvent, appendEvents, readPendingEvents, rotateQueue, deleteFile } from '../audit/audit-disk-queue.js'

/**
 * Client für Zugriff auf die separate Audit-DB. Beobachtet den auditEmitter (Observer-Pattern)
 * und persistiert jedes empfangene Audit-Event. Ist die Audit-DB nicht erreichbar, werden Events
 * in einem auf Platte persistierten Cache/Queue zwischengespeichert und später nachgeholt.
 */
class AuditClient {
    /**
     * @param {string} url - Mongo-Connection-String der Audit-DB, z.B. 'mongodb://localhost:27017/audit'.
     * @param {*} emitter - EventEmitter, auf dem 'auditEvent'-Events emittiert werden (z.B. auditEmitter).
     * @param {Object} [options]
     * @param {string} [options.queueFilePath] - Pfad der Disk-Queue-Datei für nicht persistierte Events.
     * @param {number} [options.flushIntervalMs] - Intervall des periodischen Flush-Versuchs.
     */
    constructor(url, emitter, options = {}) {
        this.url = url
        this.emitter = emitter
        this.queueFilePath = options.queueFilePath ?? './audit-queue.ndjson'
        this.flushIntervalMs = options.flushIntervalMs ?? 30000
        this.connection = null
        this.AuditEventModel = null
        this.CounterModel = null
        this.flushTimer = null
        this.flushInFlight = null
        this.writeChain = Promise.resolve()
        console.log('[AUDIT] Audit-Client created...')
    }

    /**
     * Baut die Mongoose-Verbindung zur Audit-DB auf (eigene Connection, nicht die globale Default-Connection),
     * kompiliert die Models und abonniert den Emitter.
     * @returns {Promise<void>}
     */
    connect = async () => {
        try {
            // Für die audit db ist eine weitere connection zum mongoose Server notwendig, das die default connection
            // von der lokalenDb belegt ist.
            this.connection = mongoose.createConnection(this.url, {
                // Diese beiden params machen, dass eine fehlgeschalgene Verbindung schnell fehlschlägt.
                // Damit der Cache Fallback so schnell wie möglich greift.
                bufferCommands: false,
                serverSelectionTimeoutMS: 3000
            })
            // Connection ist ein EventEmitter, ein unbehandeltes späteres error-Event würde den Prozess crashen
            this.connection.on('error', (e) => console.log('[AUDIT] Connection error...', e))
            // mongoose.createConnection gibt sosfort ein COnnection Objekt zurück, aber die eigentliche Verbindung
            // im Hintergrund dauert länger. In der nächsten Zeile wird diser Prozess des Verbindens als erfolgreiches 
            // Promise erwartet, bevor der Code danach weiter ausgeführt werden kann.
            await this.connection.asPromise()

            // Anders als z.B. das PatientSchema haben die beiden audit relevanten Schemata keine 'export default 
            // mongoose.model('Patient', patientSchema)' Zeile. Sie exportieren nur ihren Inhalt und wandeln diesen nicht
            // in ein mongoose.model um. Unter anderem, weil, sie sich sonst an die default Connection zum Server hängen
            // würden, die von der lokalenDb belegt ist. Um die Schemata mit der neuen audit conenction zu verbinden, müssen
            // sie hier an die conenction gehangen werden.            
            this.AuditEventModel = this.connection.model('AuditEvent', auditEventSchema)
            this.CounterModel = this.connection.model('Counter', counterSchema)

            // Weist dem emitter zu, dass recordEvent ausgeführt werden soll, sobald ein event mit der Bezeichnung
            // 'auditEvent' an ihn weiter gegeben wird.
            this.emitter.on('auditEvent', this.recordEvent)

            // Um zu verhindern, dass nach einem AuditDb Ausfall, die events die in der queue gelandet sind in der queue
            // liegen bleiben, obwohl die db längst wieder aktiv ist, wird ein flush timer initialisiert, der periodisch
            // den flush des queue Inhalts zur db anstoßen soll.
            this.flushTimer = setInterval(() => {
                this.flushQueue().catch(e => console.log('[AUDIT] Periodic flush failed...', e))
            }, this.flushIntervalMs)
            // Normalerweise halten setIntervall timer Node-Prozesse am laufen, solange sie aktiv sind.
            // Um zu verhindern, dass beim beenden des Prozesses der Timer den Prozess am leben hält, bis er abgelaufen ist
            // nutzt man die unref Funktion.
            this.flushTimer.unref()

            console.log('[AUDIT] Connected...')
        } catch (e) {
            console.log('[AUDIT] Connection failed...', e)
            throw new AppError(`[AUDIT] Connection failed... MongooseError: ${e}`, 500)
        }
    }

    /**
     * Meldet den Emitter-Listener ab, stoppt den Flush-Timer und trennt die Verbindung.
     * @returns {Promise<void>}
     */
    endConnection = async () => {
        this.emitter.off('auditEvent', this.recordEvent)
        clearInterval(this.flushTimer)
        await this.connection?.close()
        console.log('[AUDIT] Disconnected...')
    }

    /**
     * Observer-Callback: wird pro emittiertem Audit-Event aufgerufen. Wirft/rejected nie, damit ein
     * fehlschlagender Schreibversuch (z.B. Audit-DB down) nicht den Prozess über eine unhandled
     * rejection zum Absturz bringt, stattdessen wird auf die Disk-Queue ausgewichen.
     * @param {Object} auditPayload - { transactionId, timestamp, type, eventStatus }
     * @returns {Promise<void>}
     */
    recordEvent = async (auditPayload) => {
        try {
            await this.flushQueue()
            const entryId = await this.nextEntryId()
            await this.AuditEventModel.create({ entryId, ...auditPayload })
        } catch (e) {
            console.log('[AUDIT] Live write failed, caching to disk...', e)
            try {
                await this.enqueueWrite(auditPayload)
            } catch (diskError) {
                console.log('[AUDIT] Disk cache write also failed, event dropped...', diskError)
            }
        }
    }

    /**
     * Vergibt die nächste fortlaufende entryId über einen atomaren Zähler in der Audit-DB.
     * @returns {Promise<number>} Der neue Zählerstand.
     */
    nextEntryId = async () => {
        const counterDoc = await this.CounterModel.findOneAndUpdate(
            { _id: 'auditEntry' },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        )
        return counterDoc.seq
    }

    /**
     * Hängt ein Event ans Ende der Disk-Queue-Datei an. Läuft über writeChain, damit gleichzeitige
     * Schreibversuche (z.B. paralleles recordEvent und ein laufender Flush) sich nicht überschneiden.
     * @param {Object} event - Das nicht persistierte Audit-Event.
     * @returns {Promise<void>}
     */
    enqueueWrite = async (event) => {
        this.writeChain = this.writeChain.then(() => appendEvent(this.queueFilePath, event))
        return this.writeChain
    }

    /**
     * Stößt einen Flush der Disk-Queue an. Läuft bereits ein Flush (z.B. durch den periodischen Timer),
     * wird dessen Promise zurückgegeben, statt einen zweiten parallelen Flush zu starten.
     * @returns {Promise<void>}
     */
    flushQueue = async () => {
        if (this.flushInFlight) return this.flushInFlight
        this.flushInFlight = this.doFlush().finally(() => { this.flushInFlight = null })
        return this.flushInFlight
    }

    /**
     * Führt den eigentlichen flush aus.
     * Benennt die Queue-Datei um (damit gleichzeitige appendEvent-Aufrufe in einer neuen Datei landen), liest die
     * darin wartenden Events und versucht sie der Reihe nach in die Audit-DB zu schreiben. Events, die
     * dabei erneut fehlschlagen, werden zusammen mit allen nachfolgenden zurück in die Queue-Datei
     * geschrieben (Reihenfolge bleibt erhalten), der Rest der umbenannten Datei wird gelöscht.
     * @returns {Promise<void>}
     */
    doFlush = async () => {
        // rotateQueue läuft über writeChain, statt direkt aufgerufen zu werden, damit es erst passiert,
        // nachdem alle bereits wartenden appendEvent-Aufrufe fertig geschrieben haben. So kann ein Flush
        // die Datei nie genau in dem Moment umbenennen, in dem gerade noch reingeschrieben wird.
        this.writeChain = this.writeChain.then(() => rotateQueue(this.queueFilePath))
        const processingPath = await this.writeChain
        // rotateQueue gibt null zurück, wenn es keine Live-Queue-Datei gab (nichts zu tun) — z.B. wenn
        // die Audit-DB noch nie ausgefallen ist und nie etwas gepuffert werden musste.
        if (!processingPath) return

        // Kaputte Zeilen (z.B. durch einen Absturz mitten im Schreiben einer Zeile) werden hier schon
        // aussortiert und landen nie in events, sie sind unwiederbringlich verloren und würden beim
        // erneuten Versuch nie plötzlich doch noch gültig werden, deshalb nur zählen und droppen, nicht
        // zurück in die Queue schreiben.
        const { events, malformedLines } = await readPendingEvents(processingPath)
        if (malformedLines > 0) console.log(`[AUDIT] Dropped ${malformedLines} malformed queue line(s)`)

        // Events werden der Reihe nach versucht, damit sie in derselben Reihenfolge in der DB landen,
        // in der sie ursprünglich aufgetreten sind (bzw. in der Queue standen).
        const stillPending = []
        for (let i = 0; i < events.length; i++) {
            try {
                const entryId = await this.nextEntryId()
                await this.AuditEventModel.create({ entryId, ...events[i] })
            } catch (e) {
                // Schlägt eins fehl (z.B. weil die DB gerade wieder ausfällt), wird nicht einfach mit dem
                // nächsten Event weitergemacht, sonst könnten spätere Events erfolgreich einsortiert
                // werden, während ein früheres noch fehlt, und die Reihenfolge in der DB wäre kaputt.
                // Stattdessen wandert das fehlgeschlagene Event und alles danach unverändert zurück in
                // stillPending, und die Schleife bricht sofort ab.
                stillPending.push(...events.slice(i))
                break
            }
        }

        if (stillPending.length > 0) {
            // Wird an dieselbe writeChain gehängt wie appendEvent, damit es nicht mit einem inzwischen
            // neu eingegangenen Live-Event kollidiert, das währenddessen schon wieder in die (frische,
            // seit dem rotateQueue neue) Live-Queue-Datei geschrieben werden will.
            this.writeChain = this.writeChain.then(() => appendEvents(this.queueFilePath, stillPending))
            await this.writeChain
        }
        // Die umbenannte Datei wird jetzt gelöscht: erfolgreich geschriebene Events sind in der DB,
        // kaputte Zeilen wurden schon verworfen, und alles andere (stillPending) wurde bereits in die
        // (neue) Live-Queue-Datei zurückgeschrieben — in processingPath steckt also nichts mehr, das gebraucht wird.
        await deleteFile(processingPath)
    }
}

export default AuditClient
