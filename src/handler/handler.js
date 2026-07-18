import DataBaseClient from "../db/db-client.js"

const tiebreaker = ['maritalStatus', 'address', 'telecom']

class Handler {

    /**
     * Constructor
     * @param {*} localDbClient The dataBaseClient thats responsible for talking to the local DB
     */
    constructor(localDbClient, fhirClient, patientRegistrationService) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        this.patRegService = patientRegistrationService
        console.log('[HANDLER] Created...')
    }

    /**
     * Function for ending the connection to the local DB if needed.
     */
    endDbConenction = async () => {
        await this.databaseClient.endConnection()
    }

    /**
     * Test function, wired to the /test endpoint 
     * @param {*} req API endpoint input
     * @param {*} res Endpoint response
     */
    test = (req, res) => {
        res.status(203).json({ message: 'test Endpoint called' })
    }

    /**
     * Function to register a patient that shwos up at the frontdesk.
     * @param {*} req API Endpoint input
     * @param {*} res Endpoint response
     */
    registerPatient = async (req, res) => {
        const patientiToRegisterJson = req.body //.patientJson // Der Input ist entsprechend des PatientSchema formatiert
        let localGetPatientResponse = null
        try {
            const official = patientiToRegisterJson.name.find(name => name.use == 'official')
            localGetPatientResponse = await this.dataBaseClient.getPatientByFilter(
                {
                    'name.family': official.family,
                    'name.given': official.given[0]
                }
            )
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            // TBD: split this, siehe claude convo
            return res.status(e.statusCode ?? 500).json({ error: e.message })
        }
        
        let wantedLocalPatientInstance
        if(localGetPatientResponse != null) {
            if(localGetPatientResponse.length > 1){
                wantedLocalPatientInstance = tiebreak(localGetPatientResponse, patientiToRegisterJson)
            } else {
                wantedLocalPatientInstance = localGetPatientResponse[0]
            }
        }
        console.log(wantedLocalPatientInstance)
        
        // !!!!---TBD hier: weiteren Verlauf deer Tranasktion hinzufügen, also Abfrage der FHIR, falls lokal nicht gefunden---!!!! //

        res.status(200).json({ 
            message: 'registerPatient request accepted',
            'patientId':  wantedLocalPatientInstance.id
        })
    }

    createPatient = async (req, res) => {
        await this.dataBaseClient.addPatient(req.body)
        res.status(200).json({message: 'Patient successfully created'})
    }
}

/**
 * Tiebreaker function, to filter out a unique patient, if several patients exist that share name and birthdate.
 * @param {*} listOfPatientInstances    The list of non unique patients, sharing at least name and birthdate.
 * @param {*} patientiToSearchFor       The patientJSON we got as the patient to register. 
 * @param {*} i                         An iterator, that is increased while going through the lsit of patients. Default is 0.
 * @returns                             One of the following: 
 *                                      - A unique patient 
 *                                      - Nothing in case no unique patient is found 
 *                                      - A recursive call of itself
 */
const tiebreak = (listOfPatientInstances, patientiToSearchFor, i = 0) => {
    console.log('[TIEBREAKER] Started')
    if(listOfPatientInstances.length == 1) {
        console.log('[TIEBREAKER] Unique patient found')
        return listOfPatientInstances[0]
    }
    if(i >= tiebreaker.length) {
        console.log('[TIEBREAKER] Ran out of tiebreakers. No unique patient found')
        return null
    }

    const currentTiebreaker = tiebreaker[i]
    console.log('[TIEBREAKER] Filtering by tiebreaker', currentTiebreaker)

    // The next line is a function, that removes the mongoose '_id' value from an attribute of
    // a patient instance, that mongoose has returned to us from the db.
    // To make it comparable to the attribute of the JSON from the patient we need to register.
    // Basicaly th function says "Turn this attribute and its content into a string except for the key '_id', that should be undefined."
    // Which in this case means, it does not exist anymore.
    const removeIdKeyFromMongoosePatientAttribute = (patientiInstance) => JSON.stringify(patientiInstance, (key, val) => key === '_id' ? undefined : val)

    // The next three lines filter out all the patient instances, 
    // that are equal to the to-be-registered-patient, regarding the tiebreaker.
    // Only these instances are left and kept in the listOfPatientInstances.
    const filteredlistOfPatientInstances = listOfPatientInstances.filter(
        patient => removeIdKeyFromPatientInstance(patient[currentTiebreaker]) === JSON.stringify(patientiToSearchFor[currentTiebreaker])
    )
    return tiebreak(filteredlistOfPatientInstances, patientiToSearchFor, i + 1)
}

export default Handler
