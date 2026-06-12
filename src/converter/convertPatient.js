/**
 * @param {import('mongoose').Document} patient 
 * Es muss sich um ein mongoose.Document handeln.
 * Das ist das, was man bei der ABfrage aus einer mongoDB erhält.
 */
const toFhir = (patient) => {
    const plain = patient.toObject()
    return { resourceType: 'Patient', ...plain }
    
}

const toMongo = (patient) => {
    delete patient.resourceType
    return patient
}