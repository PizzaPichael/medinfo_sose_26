import fs from 'node:fs/promises'

let hello = "hello"
var world = "world"
const where = "people"

const runner = () => {
    console.log(`${hello}, ${where}`)
}

const searchPatients = async () => {
    const result = await fetch('https://hapi.fhir.org/baseR4/Patient?_count=50000')
    if (!result.ok) throw new Error(`HTTP ${result.status}`)
    const patients = await result.json()
    await fs.writeFile('patients.json', JSON.stringify(patients, undefined, 2))
}

const getPatient = async () => {
    const result = await fetch('https://hapi.fhir.org/baseR4/Patient/90410791')
    const patient = await result.json()
    await fs.writeFile('patient.json', JSON.stringify(patient, undefined, 2))
    console.log(patient)
    console.log(patient.gender)
    console.log(patient.birthDate)
    console.log(patient.name[0])
}


const run = async () => {
    // await getPatient()
    await searchPatients()
}

run()