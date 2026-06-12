import fs from 'node:fs/promises'

let hello = "hello"
var world = "world"
const where = "people"

const runner = () => {
    console.log(`${hello}, ${where}`)
}

const getPatientByAttribute = async (key, value) => {
    const params = newUrlSearchParams({ [key]: value })
    const result = await fetch('https://hapi.fhir.org/baseR4/Patient?${params}')
    if (!result.ok) throw new Error(`HTTP ${result.status}`)
    return await result.json()
}

const putNewPatient = async (id, patient) => {
    const result = await fetch('https://hapi.fhir.org/baseR4/Patient/${id}', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify(patient)
    })
    if (!result.ok) throw new Error(`HTTP ${result.status}`)
    return await result.json()
}


const run = async () => {
    // await getPatient()
    await searchPatients()
}

run()