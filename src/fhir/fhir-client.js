import AppError from '../errors/AppError.js'

/**
 * Client für Zugriff auf einen FHIR-Server (Suche und Anlegen/Aktualisieren von Patient-Ressourcen).
 */
class FhirClient {
    constructor(fhirServerUrl) {
        this.url = fhirServerUrl
        console.log('[FHIR] Fhir-Client created...')
    }

    /**
     * Sucht Patient-Ressourcen anhand beliebiger Suchparameter (z.B. { birthdate, name }).
     * @param {Object} filterAttributes - Key-Value-Paare als FHIR-Suchparameter, z.B. { birthdate: '1990-01-01', name: 'Müller' }.
     * @returns {Promise<Object>} FHIR-Bundle mit den gefundenen Patienten.
     */
    getPatientByFilter = async (filterAttributes) => {
        const params = new URLSearchParams(filterAttributes)
        const result = await fetch(`${this.url}/Patient?${params}`)
        if (!result.ok) throw new AppError(`[FHIR] Error getting patient by attribute... FHIR: ${result}`, result.status)
        const resultJson =  await result.json()
        if(resultJson.total === 0) {
            // Gibt leeres Array zurück, damit RegisterPatient weiß, dass es eine neue
            // Patientin anlegen muss. Fehler werfen würde hier die ganze Transaktion abbrechen.
            return []
        } 

        const receivedPatients = []
        for (const entry of resultJson.entry) {
            receivedPatients.push(entry.resource)
        }
        return receivedPatients
    }

    /**
     * Legt eine Patient-Ressource mit gegebener ID an oder aktualisiert sie vollständig (FHIR PUT/Update).
     * @param {Object} patient - FHIR-Patient-Ressource nach dem patientSchema, muss `id` enthalten.
     * @returns {Promise<Object>} Die vom Server gespeicherte Patient-Ressource.
     */
    putNewPatient = async (patient) => {
        const result = await fetch(`${this.url}/Patient/${patient.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/fhir+json'
            },
            body: JSON.stringify(patient)
        })
        if (!result.ok) throw new AppError(`[FHIR] Error creating new patient... FHIR: ${result}`, result.status)
        return await result.json()
    }
}

export default FhirClient
