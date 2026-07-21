import AppError from '../errors/AppError.js'

/**
 * Client für Zugriff auf einen FHIR-Server (Suche und Anlegen/Aktualisieren von Patient-Ressourcen).
 */
class FhirClient {
    /**
     * @param {string} fhirServerUrl - Basis-URL des FHIR-Servers, z.B. 'https://hapi.fhir.org/baseR4'.
     */
    constructor(fhirServerUrl) {
        this.url = fhirServerUrl
        console.log('[FHIR] Fhir-Client created...')
    }

    /**
     * Sucht Patient-Ressourcen anhand beliebiger Suchparameter (z.B. { birthdate, name }).
     * Erwartet die parameter in der Syntax, die von FHIR genutz wird, also Vorname z.B. nicht 'surName', sondern 'given'.
     * Entfernt fhir json balast und gibt nur die resource Einträge der einzelnen entry Objekte des entry
     * arrays zurück, weil diese die Patienten Instanz in unserem Schema enthalten.
     * @param {Object} filterAttributes - Key-Value-Paare als FHIR-Suchparameter, z.B. { birthdate: '1990-01-01', name: 'Müller' }.
     * @returns {Promise<Object>} Array mit Patienten Instanzen
     */
    getPatientByFilter = async (filterAttributes) => {
        console.log('[FHIR] getPatientByFilter called')
        const params = new URLSearchParams(filterAttributes)
        const result = await fetch(`${this.url}/Patient?${params}`)
        if (!result.ok) throw new AppError(`[FHIR] Error getting patient by attribute... FHIR: ${result}`, result.status)
        const resultJson = await result.json()
        if (resultJson.total === 0) {
            // Gibt leeres Array zurück, damit RegisterPatient weiß, dass es eine neue
            // Patientin anlegen muss. Fehler werfen würde hier die ganze Transaktion abbrechen.
            console.log('[FHIR] No patient found')
            return []
        }

        const receivedPatients = []
        for (const entry of resultJson.entry) {
            // Destrukturiert resource und zieht meta separat raus, damit es im patient nicht mehr vorhanden ist
            const { meta, ...patient } = entry.resource
            receivedPatients.push(patient)
        }
        console.log('[FHIR] Patient(s) found, returning')
        return receivedPatients
    }

    getOpenEncountersForPatient = async (patientId) => {
        const result = await fetch(`${this.url}/Encounter?subject=Patient/${patientId}`)
        if (!result.ok) throw new AppError(`[FHIR] Error getting open encounters... FHIR: ${result}`, result.status)
        return await result.json()
    }

    getEncounterById = async (encounterId) => {
        const result = await fetch(`${this.url}/Encounter/${encounterId}`)
        if (result.status === 404) {
            return null
        }
        if (!result.ok) {
            throw new AppError(`[FHIR] Error getting encounter ${encounterId}... FHIR: ${result}`, result.status)
        }
        return await result.json()
    }

    createEncounter = async (encounter) => {
        const result = await fetch(`${this.url}/Encounter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json',
            },
            body: JSON.stringify(encounter),
        });

        if (!result.ok) {
            throw new AppError(
                `Could not create encounter at FHIR server. Status: ${result.status}`,
                result.status
            );
        }

        return await result.json();
    }

    getEncounterById = async (encounterId) => {
        return await fetch(`${this.url}/Encounter/${encounterId}`);
    }

    updateEncounter = async (encounterId, encounter) => {
        const result = await fetch(`${this.url}/Encounter/${encounterId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/fhir+json',
            },
            body: JSON.stringify(encounter),
        });
        return await result;
    }

    createProcedure = async (procedure) => {
        const result = await fetch(`${this.url}/Procedure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json',
            },
            body: JSON.stringify(procedure),
        });

        if (!result.ok) {
            throw new AppError(
                `Could not create procedure at FHIR server. Status: ${result.status}`,
                result.status
            );
        }

        return await result.json();
    }

    /**
     * Legt eine Patient-Ressource auf dem FHIR-Server an (POST /Patient).
     * Der FHIR-Server vergibt dabei eine eigene id; die zurückgegebene Ressource enthält diese id.
     * Entfernt wie getPatientByFilter das meta-Element, damit die Ressource unserem Schema entspricht.
     * @param {Object} patientJson - Der anzulegende Patient nach dem Patient-Schema.
     * @returns {Promise<Object>} Die vom FHIR-Server angelegte Patient-Ressource inkl. vergebener id.
     */
    createPatient = async (patientJson) => {
        console.log('[FHIR] createPatient called')
        const result = await fetch(`${this.url}/Patient`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/fhir+json' },
            body: JSON.stringify(patientJson)
        })
        if (!result.ok) throw new AppError(`[FHIR] Error creating patient... FHIR status: ${result.status}`, result.status)
        const { meta, ...createdPatient } = await result.json()
        console.log('[FHIR] Patient created, returning')
        return createdPatient
    }
}

export default FhirClient
