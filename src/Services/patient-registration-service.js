class PatientRegistration {

    constructor(localDbClient, fhirClient) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        console.log('[PATIENT-REGISTRATION] Created...')
    }

    registerPatient = async (patientJson) => {
        const name = patientJson.name?.find(elem => elem.use == "official")
        const birthDate = patientJson.birthDate

        Handler.askDbIfPatientExist(name, birthDate)
    }
}