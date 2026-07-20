import AppError from '../errors/AppError.js'

const tiebreaker = ['maritalStatus', 'address', 'telecom']

class PatientRegistration {

    constructor(localDbClient, fhirClient) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        console.log('[PATIENT-REGISTRATION] Created...')
    }

    
    getPatientFromDb = async (dbClient, patientJson) => {
        let getPatientResponse = null
        let wantedPatientInstance = null

        const official = patientJson.name.find(name => name.use == 'official')
        const filterAttributes = {
            'familyName': official.family,
            'surName': official.given[0],
            'birthDate': patientJson.birthDate
        }

        getPatientResponse = await this.dbClient.getPatientByFilter(
            {
                'name.family': filterAttributes.familyName,
                'name.given': filterAttributes.surName,
                'birthDate': filterAttributes.birthDate
            }
        )
        
        if(getPatientResponse != null) {
            if(getPatientResponse.length > 1){
                wantedPatientInstance = tiebreak(getPatientResponse, patientJson)
            } else {
                wantedPatientInstance = getPatientResponse[0]
            }
            return wantedPatientInstance
        }
        return null
    }

    /**
     * 
     * @param {*} patientJson 
     * @returns 
     */
    registerPatient = async (patientJson) => {     
        const wantedLocalPatientInstance = await getPatientFromDb(this.localDbClient, patientJson)
        const wantedFhirPatientInstance = await getPatientFromDb(this.fhirClient, patientJson)
        // Get whichever is not null in next line, can also be x ? x : y === x ?? y
        const outputPatientInstance = wantedLocalPatientInstance ?? wantedFhirPatientInstance

        if(outputPatientInstance) {
            return outputPatientInstance
        } else {
            // TBD Create PAtienti localy if no aptient found
        }
        return null //TBD
    }

    createPatient = async (patientJson) => {
        try {
            await this.dataBaseClient.addPatient(patientJson)
            return true
        }
        catch (e) {
            throw e
        }
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
    console.log('[REGISTRATION TIEBREAKER] Started')
    if(listOfPatientInstances.length == 1) {
        console.log('[REGISTRATION TIEBREAKER] Unique patient found')
        return listOfPatientInstances[0]
    }
    if(i >= tiebreaker.length) {
        console.log('[REGISTRATION TIEBREAKER] Ran out of tiebreakers. No unique patient found')
        throw new AppError('[REGISTRATION TIEBREAKER] Ran out of tiebreakers. No unique patient found', 400)
    }

    const currentTiebreaker = tiebreaker[i]
    console.log('[REGISTRATION TIEBREAKER] Filtering by tiebreaker', currentTiebreaker)

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

export default PatientRegistration
