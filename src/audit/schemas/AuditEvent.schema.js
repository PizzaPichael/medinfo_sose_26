import mongoose from 'mongoose'

/**
 * Rohes Mongoose-Schema, ohne am ende mongoose.model aufzurufen, für einen Audit-Eintrag. Wird NICHT hier zu einem Model kompiliert,
 * weil die Audit-DB über eine eigene mongoose.createConnection()-Instanz läuft (nicht die
 * globale Default-Connection). AuditClient.connect() kompiliert dieses Schema gegen seine
 * eigene Connection via connection.model('AuditEvent', auditEventSchema).
 */
const auditEventSchema = new mongoose.Schema({
    entryId: Number,        // fortlaufende Nummer, vergeben über die Counter-Collection
    transactionId: String,  // v4 UUID, identifiziert die zugehörige Transaktion/Request
    timestamp: String,      // ISO-Datum
    type: String,           // z.B. 'registerPatient', 'localSearch', 'fhirSearch', 'patientCreated'
    eventStatus: Number      // HTTP-artiger Statuscode, z.B. 200 oder 500
})

export default auditEventSchema
