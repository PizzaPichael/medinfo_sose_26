import mongoose from 'mongoose'

/**
 * Rohes Mongoose-Schema, ohne am ende mongoose.model aufzurufen, für den Zähler, der die fortlaufende entryId der Audit-Events liefert.
 * Wie AuditEvent.schema.js nicht hier kompiliert, sondern von AuditClient gegen die Audit-Connection gebunden.
 */
const counterSchema = new mongoose.Schema({
    _id: String,                        // Zähler-Name, z.B. 'auditEntry'
    seq: { type: Number, default: 0 }   // aktueller Zählerstand
})

export default counterSchema
