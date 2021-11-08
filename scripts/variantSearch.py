import sys
import json
import requests

# script for query 2. 

VECTIS_URL = 'https://vsal.garvan.org.au/vsal/core/find'

def main():
    filename = sys.argv[1]
    
    with open(filename) as f:
        patients = json.load(f)
        
    chromosome = input("Please enter your chromosome ")
    start = input("Please enter the start position ")
    end = input("Please enter the end position ")
    refAllele = input("Please enter the reference allele ")
    altAllele = input("Please enter the alternate allele ")
    
    params = {
        'chromosome': chromosome,
        'positionStart': start,
        'positionEnd': end,
        'limit': 10000,
        'dataset': 'DEMO',
        'het': True,
        'hom': True,
        'refAllele': refAllele,
        'altAllele': altAllele,
        'jwt': 'fakeToken',
        'selectSamplesByGT': True,
        'conj': False
    }

    response = requests.get(VECTIS_URL, params=params)
    response = response.json()
    patient_ids = response["sampleIDs"]

    patient_matches = []
    phenotypes = [] 
    
    for patient in patients:
        if patient['report_id'] in patient_ids:
            patient_matches.append(patient)
            features = patient["features"]
            for feature in features:
                match = 0
                for phenotype in phenotypes:
                    if feature["id"] == phenotype["id"]:
                        match = 1
                        phenotype['num_patients'] += 1
                        phenotype['patients'].append(patient['report_id'])
                        continue
                if match == 0:
                    phenotypes.append({'phenotype': feature['label'], 'id': feature['id'], 'num_patients': 1, 'patients': [patient['report_id']]})

    # sort results into descending order based on cutoff value
    final_output = []
    cutoff_value = int(input("Enter the cutoff value, or 0 if you do not wish to have a cutoff value. "))
    for phenotype in phenotypes:
        if phenotype["num_patients"] >= cutoff_value:
            final_output.append(phenotype)
    
    final_output = sorted(final_output, key=lambda final_output:final_output["num_patients"], reverse=True)
    
    with open("variantOutput.json", "w") as f:       
        json.dump(final_output, f, indent=4)
    
if __name__ == "__main__":
    main()