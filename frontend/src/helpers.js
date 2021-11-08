/**
 * Process results and return in table format
 * @param {*} results
 */

export function processResults(results) {
  let finalResults = [];
  results.forEach((r, idx) => {
    let HPOterm = r.name.concat(" - ").concat(r.label);
    let str = "";
    r.patients.forEach((p, idx) => {
      if (idx !== r.patients.length - 1) {
        str = str.concat(p.patientId).concat(", ");
      } else {
        str = str.concat(p.patientId);
      }
    });
    finalResults.push({ id: idx, col1: HPOterm, col2: str });
  });

  return finalResults;
}

/**
 * Functions to process data to correct format for bar charts
 * @param {*} results
 */
export function processBarData(results) {
  let jsonVariable = {};
  jsonVariable["id"] = "Results";
  let keys = [];
  results.forEach((r) => {
    let jsonKey = r.label;
    keys.push(r.label);
    jsonVariable[jsonKey] = r.patients.length;
  });

  return [jsonVariable, keys];
}

export function processBarDataSeparate(results) {
  let finalResults = [];
  results.forEach((r) => {
    let jsonKey = r.label;
    let jsonVariable = {};
    jsonVariable["id"] = jsonKey;
    jsonVariable["value"] = r.patients.length;
    finalResults.push(jsonVariable);
  });

  return finalResults;
}

/**
 * Function to export names panels from full panel data
 */
export function processPanelData(panels) {
  let finalPanels = [];
  panels.forEach((panel) => {
    finalPanels.push(`${panel.name} (${panel.stats.number_of_genes})`);
  });
  return finalPanels;
}

/**
 * Function to process genes in panel to extract chromosome and location
 */

export function extractGeneLocations(panelData) {
  let names = [];
  let chromosomes = [];
  let startLocations = [];
  let endLocations = [];

  panelData.forEach((gene) => {
    if (!gene.gene_data.ensembl_genes["GRch37"]) return;
    let location = gene.gene_data.ensembl_genes["GRch37"]["82"]["location"];
    names.push(gene.gene_data.gene_symbol);
    chromosomes.push(`CH${location.split(":")[0]}`);
    startLocations.push(location.split(":")[1].split("-")[0]);
    endLocations.push(location.split(":")[1].split("-")[1]);
  });

  return [
    names.join(","),
    chromosomes.join(","),
    startLocations.join(","),
    endLocations.join(","),
  ];
}

export function processPatientData(patientData) {
  let maternalEthnicity = [];
  maternalEthnicity.push({ type: "unknown", patients: [] });
  let paternalEthnicity = [];
  paternalEthnicity.push({ type: "unknown", patients: [] });
  let affectedRelatives = [];
  affectedRelatives.push({ type: "true", patients: [] });
  affectedRelatives.push({ type: "false", patients: [] });
  affectedRelatives.push({ type: "unknown", patients: [] });
  let consanguinity = [];
  consanguinity.push({ type: "true", patients: [] });
  consanguinity.push({ type: "false", patients: [] });
  consanguinity.push({ type: "unknown", patients: [] });
  let females = [];
  let males = [];
  let unknownGender = [];

  patientData.patient_data.forEach((patient) => {
    // process gender

    switch (patient.sex) {
      case "FEMALE":
        females.push(patient.patientId);
        break;
      case "F": {
        females.push(patient.patientId);
        break;
      }
      case "MALE":
        males.push(patient.patientId);
        break;
      case "M": {
        males.push(patient.patientId);
        break;
      }
      default: {
        unknownGender.push(patient.patientId);
      }
    }

    // process ethnicity
    if (
      patient.maternalEthnicity === "undefined" ||
      patient.maternalEthnicity === undefined
    ) {
      maternalEthnicity.forEach((m) => {
        if (m.type === "unknown") {
          m.patients.push(patient.patientId);
          return;
        }
      });
    } else {
      let matchFound = 0;
      maternalEthnicity.forEach((m) => {
        if (m.type === patient.maternalEthnicity) {
          m.patients.push(patient.patientId);
          matchFound = 1;
        }
      });
      if (matchFound === 0) {
        maternalEthnicity.push({
          type: patient.maternalEthnicity,
          patients: [patient.patientId],
        });
      }
    }

    if (
      patient.paternalEthnicity === "undefined" ||
      patient.paternalEthnicity === undefined
    ) {
      paternalEthnicity.forEach((m) => {
        if (m.type === "unknown") {
          m.patients.push(patient.patientId);
          return;
        }
      });
    } else {
      let matchFound = 0;
      paternalEthnicity.forEach((m) => {
        if (m.type === patient.paternalEthnicity) {
          m.patients.push(patient.patientId);
          matchFound = 1;
        }
      });
      if (matchFound === 0) {
        paternalEthnicity.push({
          type: patient.paternalEthnicity,
          patients: [patient.patientId],
        });
      }
    }

    // process family history
    if (
      patient.affectedRelatives === null ||
      patient.affectedRelatives === undefined
    ) {
      patient.affectedRelatives = "unknown";
    }
    if (patient.consanguinity === undefined) {
      patient.consanguinity = "unknown";
    }

    affectedRelatives.forEach((ar) => {
      if (ar.type === patient.affectedRelatives.toString()) {
        ar.patients.push(patient.id);
      }
    });
    consanguinity.forEach((ar) => {
      if (ar.type === patient.consanguinity.toString()) {
        ar.patients.push(patient.id);
      }
    });
  });

  let genders = {
    female: { patients: females, count: females.length },
    male: { patients: males, count: males.length },
    unknown: { patients: unknownGender, count: unknownGender.length },
  };

  return [
    genders,
    maternalEthnicity,
    paternalEthnicity,
    affectedRelatives,
    consanguinity,
  ];
}

export function processGender(data) {
  let finalData = [];

  finalData.push({
    id: "female",
    label: "Female",
    value: data["female"].count,
  });
  finalData.push({ id: "male", label: "Male", value: data["male"].count });
  finalData.push({
    id: "unknown",
    label: "Unknown",
    value: data["unknown"].count,
  });

  return finalData;
}

export function processPieChartData(data) {
  let finalData = [];

  data.forEach((d) => {
    finalData.push({ id: d.type, label: d.type, value: d.patients.length });
  });

  return finalData;
}

export function processVectisInput(patients, mappings) {
  const cohortDataset = {
    Demo: "demo",
    "Acute Care": "acutecarepro",
    Mitochondria: "mito",
  };

  let cohorts = {};
  let currentCohort = "";
  let i = 0;

  for (i; i < patients.length; i++) {
    if (patients[i].cohort !== currentCohort) {
      currentCohort = patients[i].cohort;
      if (cohorts[cohortDataset[currentCohort]] === undefined) {
        cohorts[cohortDataset[currentCohort]] = [];
      }
    }
    cohorts[cohortDataset[currentCohort]].push(mappings[i]);
  }
  return cohorts;
}
