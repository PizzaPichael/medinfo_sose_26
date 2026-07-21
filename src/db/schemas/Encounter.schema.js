import mongoose from 'mongoose'

const CodingSchema = new mongoose.Schema({
  system: { type: String },
  code: { type: String },
  display: { type: String }
}, { _id: false });

const ClassSchema = new mongoose.Schema({
  coding: { type: [CodingSchema], default: undefined }
}, { _id: false });

const TextSchema = new mongoose.Schema({
  status: { type: String },
  div: { type: String }
}, { _id: false });

const ReferenceSchema = new mongoose.Schema({
  reference: { type: String, required: true },
}, { _id: false });

/** Schema for a FHIR Encounter resource based on https://fhir.hl7.org/fhir/encounter-example.json.html */
const EncounterSchema = new mongoose.Schema({
  encounterId: {
    type: String,
    required: true,
    index: true
  },
  id: { type: String },
  text: { type: TextSchema },
  status: { type: String }, // planned | in-progress | on-hold | discharged | completed | cancelled | discontinued | entered-in-error | unknown
  class: { type: [ClassSchema], default: undefined },
  subject: { type: ReferenceSchema },
  subjectStatus: {
    coding: { type: [CodingSchema], default: undefined }
  },
  careTeam: { type: [ReferenceSchema], default: undefined }
});

export default mongoose.model('Encounter', EncounterSchema);