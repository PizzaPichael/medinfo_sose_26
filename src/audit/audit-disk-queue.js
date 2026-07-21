import { appendFile, readFile, rename, unlink } from 'node:fs/promises'

/**
 * Reine I/O-Funktionen für den auf Platte persistierte Audit-Event-Cache.
 * Der Cache wird in einer NDJSON-Datei als Queue gespeichert.
 * Jede Funktion nimmt den Dateipfad explizit entgegen.
 * Damit sie isoliert mit echten Temp-Dateien testbar ist.
 */

/**
 * Hängt ein Event als eine NDJSON-Zeile an die Queue-Datei an.
 * @param {string} filePath
 * @param {Object} event
 * @returns {Promise<void>}
 */
export const appendEvent = async (filePath, event) => {
    await appendFile(filePath, JSON.stringify(event) + '\n')
}

/**
 * Hängt mehrere Events als NDJSON-Zeilen an die Queue-Datei an.
 * @param {string} filePath
 * @param {Object[]} events
 * @returns {Promise<void>}
 */
export const appendEvents = async (filePath, events) => {
    if (events.length === 0) return
    await appendFile(filePath, events.map(event => JSON.stringify(event)).join('\n') + '\n')
}

/**
 * Liest alle ausstehenden Events aus der Queue-Datei. Fehlt die Datei, wird ein leeres Ergebnis
 * zurückgegeben. Kaputte/unvollständige Zeilen (z.B. durch einen Absturz während des Schreibens)
 * werden übersprungen und gezählt, statt das gesamte Lesen scheitern zu lassen.
 * @param {string} filePath
 * @returns {Promise<{events: Object[], malformedLines: number}>}
 */
export const readPendingEvents = async (filePath) => {
    let content
    try {
        content = await readFile(filePath, 'utf8')
    } catch (e) {
        if (e.code === 'ENOENT') return { events: [], malformedLines: 0 } // ENOENT steht für "Error No Entry", z.B. wenn die Datei nicht existiert
        throw e
    }

    const events = []
    let malformedLines = 0
    for (const line of content.split('\n')) {
        if (line.trim() === '') continue
        try {
            events.push(JSON.parse(line))
        } catch (e) {
            malformedLines++
        }
    }
    return { events, malformedLines }
}

/**
 * Benennt die aktuelle Queue-Datei um, damit ein Flush-Vorgang nicht mit gleichzeitigen
 * appendEvent-Aufrufen kollidiert. Gibt null zurück, falls es nichts umzubenennen gibt.
 * @param {string} filePath
 * @returns {Promise<string|null>} Pfad der umbenannten Datei, oder null.
 */
export const rotateQueue = async (filePath) => {
    const processingPath = filePath + '.processing'
    try {
        await rename(filePath, processingPath)
        return processingPath
    } catch (e) {
        if (e.code === 'ENOENT') return null
        throw e
    }
}

/**
 * Löscht eine Datei, falls vorhanden (best-effort, ENOENT wird geschluckt).
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
    try {
        await unlink(filePath)
    } catch (e) {
        if (e.code !== 'ENOENT') throw e
    }
}
