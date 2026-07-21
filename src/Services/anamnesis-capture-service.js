import { randomUUID } from 'node:crypto'
import AppError from '../errors/AppError.js'
import auditEmitter from '../audit/audit-emitter.js'

/**
 * Liefert den Vergleichs-Code einer CodeableConcept (coding[0].system|code, Fallback: text).
 * Dient als Duplikat-Schlüssel beim Abgleich mit bestehenden Einträgen.
 * @param {Object} codeableConcept - z.B. condition.code oder medicationStatement.medicationCodeableConcept.
 * @returns {string|null} Der Vergleichs-Schlüssel oder null, falls kein Code vorhanden ist.
 */
const codeKey = (codeableConcept) => {
    const coding = codeableConcept?.coding?.[0]
    if (coding?.code) {
        return `${coding.system ?? ''}|${coding.code}`
    }
    return codeableConcept?.text ?? null
}

/**
 * Service zur Erfassung des Anamnesebogens: nimmt ein FHIR-Bundle (transaction) mit Conditions
 * (Vorerkrankungen) und MedicationStatements (Dauermedikamente) entgegen, prüft Patient und Consent
 * und speichert nur die Einträge, die lokal noch nicht existieren (Abgleich = nur Neues ergänzen).
 */
class AnamnesisCapture {

    /**
     * @param {*} localDbClient - Client für die lokale DB (implementiert getPatientByFilter, getConditionsByPatientId,
     *                            getMedicationStatementsByPatientId, addCondition, addMedicationStatement).
     * @param {*} consentRetrievalService - Service für Consent-Prüfung (implementiert checkConsentForPatient).
     */
    constructor(localDbClient, consentRetrievalService) {
        this.dataBaseClient = localDbClient
        this.consentService = consentRetrievalService
        console.log('[ANAMNESIS] Created...')
    }

    /**
     * Validiert das Bundle strukturell und zerlegt es in Conditions und MedicationStatements.
     * Alle Ressourcen müssen dieselbe Patient:in via subject.reference 'Patient/{id}' referenzieren.
     * @param {*} bundleJson - Das FHIR-Bundle (transaction) aus dem Request-Body.
     * @returns {{patientId: string, conditions: Object[], medicationStatements: Object[]}}
     * @throws {AppError} 400 bei ungültiger Struktur.
     */
    validateBundle = (bundleJson) => {
        if (bundleJson?.resourceType !== 'Bundle' || bundleJson?.type !== 'transaction') {
            throw new AppError('[ANAMNESIS] Body must be a Bundle of type "transaction"', 400)
        }
        if (!Array.isArray(bundleJson.entry) || bundleJson.entry.length === 0) {
            throw new AppError('[ANAMNESIS] Bundle must contain at least one entry', 400)
        }

        const conditions = []
        const medicationStatements = []
        let patientId = null

        for (const entry of bundleJson.entry) {
            const resource = entry?.resource
            if (!resource) {
                throw new AppError('[ANAMNESIS] Every bundle entry must contain a resource', 400)
            }
            if (resource.resourceType !== 'Condition' && resource.resourceType !== 'MedicationStatement') {
                throw new AppError(`[ANAMNESIS] Unsupported resourceType in bundle: ${resource.resourceType}`, 400)
            }

            const reference = resource.subject?.reference
            if (!reference?.startsWith('Patient/')) {
                throw new AppError('[ANAMNESIS] Every resource needs subject.reference "Patient/{id}"', 400)
            }
            const referencedPatientId = reference.slice('Patient/'.length)
            patientId = patientId ?? referencedPatientId
            if (referencedPatientId !== patientId) {
                throw new AppError('[ANAMNESIS] All resources must reference the same patient', 400)
            }

            if (resource.resourceType === 'Condition') {
                conditions.push(resource)
            } else {
                medicationStatements.push(resource)
            }
        }
        console.log('[ANAMNESIS] Bundle validated')
        return { patientId, conditions, medicationStatements }
    }

    /**
     * Abgleich: teilt eingehende Ressourcen in neue und bereits vorhandene (gleicher Code) auf.
     * @param {Object[]} incoming - Ressourcen aus dem Bundle.
     * @param {Object[]} existing - Bereits lokal gespeicherte Ressourcen derselben Patient:in.
     * @param {Function} codeExtractor - Liefert die CodeableConcept einer Ressource (z.B. r => r.code).
     * @returns {{newResources: Object[], skippedKeys: string[]}}
     */
    filterNewResources = (incoming, existing, codeExtractor) => {
        const existingKeys = new Set(existing.map(resource => codeKey(codeExtractor(resource))))
        const newResources = []
        const skippedKeys = []
        for (const resource of incoming) {
            const key = codeKey(codeExtractor(resource))
            if (key !== null && existingKeys.has(key)) {
                skippedKeys.push(key)
                continue
            }
            newResources.push(resource)
        }
        return { newResources, skippedKeys }
    }

    /**
     * Erfasst den Anamnesebogen: validiert das Bundle, prüft Patient und Consent, gleicht mit
     * bestehenden Daten ab und speichert nur neue Conditions/MedicationStatements.
     * @param {*} bundleJson - Das FHIR-Bundle (transaction) aus dem Request-Body.
     * @param {string} transactionId - Korreliert alle Audit-Events dieser Erfassung.
     * @returns {Promise<Object>} Ergebnis mit patientId, created- und skipped-Listen.
     */
    captureAnamnesis = async (bundleJson, transactionId) => {
        console.log('[ANAMNESIS] captureAnamnesis called')
        const { patientId, conditions, medicationStatements } = this.validateBundle(bundleJson)

        // Patient:in muss lokal existieren (Transaktion 1 muss vorher gelaufen sein)
        const patients = await this.dataBaseClient.getPatientByFilter({ id: patientId })
        if (patients.length === 0) {
            throw new AppError(`[ANAMNESIS] No local patient with id ${patientId}, register patient first`, 404)
        }

        // DSGVO-Consent muss gültig sein (wirft AppError, falls nicht)
        await this.consentService.checkConsentForPatient(patientId)

        // Abgleich: bestehende Einträge laden, nur Neues ergänzen
        const existingConditions = await this.dataBaseClient.getConditionsByPatientId(patientId)
        const existingMedicationStatements = await this.dataBaseClient.getMedicationStatementsByPatientId(patientId)

        const conditionSplit = this.filterNewResources(conditions, existingConditions, resource => resource.code)
        const medicationSplit = this.filterNewResources(medicationStatements, existingMedicationStatements, resource => resource.medicationCodeableConcept)

        const createdConditionIds = []
        for (const condition of conditionSplit.newResources) {
            condition.id = condition.id ?? randomUUID()
            await this.dataBaseClient.addCondition(condition)
            createdConditionIds.push(condition.id)
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'anamnesisConditionCreated', eventStatus: 200 })
        }

        const createdMedicationStatementIds = []
        for (const medicationStatement of medicationSplit.newResources) {
            medicationStatement.id = medicationStatement.id ?? randomUUID()
            await this.dataBaseClient.addMedicationStatement(medicationStatement)
            createdMedicationStatementIds.push(medicationStatement.id)
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'anamnesisMedicationStatementCreated', eventStatus: 200 })
        }

        console.log(`[ANAMNESIS] Done. Created ${createdConditionIds.length} conditions, ${createdMedicationStatementIds.length} medication statements`)
        return {
            patientId,
            created: {
                conditions: createdConditionIds,
                medicationStatements: createdMedicationStatementIds
            },
            skipped: {
                conditions: conditionSplit.skippedKeys,
                medicationStatements: medicationSplit.skippedKeys
            }
        }
    }
}

export default AnamnesisCapture
