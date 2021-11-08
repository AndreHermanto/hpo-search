import sys
import json

# python script to change sampleId's to Vectis format

sampleIds = [
    "SRR1291024",
    "SRR1291026",
    "SRR1291030",
    "SRR1291035",
    "SRR1291036",
    "SRR1291041",
    "SRR1291070",
    "SRR1291138",
    "SRR1291141",
    "SRR1291157",
    "SRR1293236",
    "SRR1293251",
    "SRR1293262",
    "SRR1293283",
    "SRR1293295",
    "SRR1293326",
    "SRR1295423",
    "SRR1295424",
    "SRR1295425",
    "SRR1295426",
    "SRR1295432",
    "SRR1295433",
    "SRR1295465",
    "SRR1295466",
    "SRR1295515",
    "SRR1295532",
    "SRR1295533",
    "SRR1295534",
    "SRR1295535",
    "SRR1295536",
    "SRR1295537",
    "SRR1295538",
    "SRR1295539",
    "SRR1295540",
    "SRR1295542",
    "SRR1295543",
    "SRR1295544",
    "SRR1295545",
    "SRR1295546",
    "SRR1295552",
    "SRR1295553",
    "SRR1295554",
    "SRR1295568",
    "SRR1295570",
    "SRR1298980",
    "SRR1298981",
    "SRR1298988",
    "SRR1298989",
    "SRR622457",
    "SRR622458",
    "SRR622459"
]

filename = "/Users/stephanietong/Documents/Garvan/HPO-Search/hpo-search/data/sample.json"

with open(filename) as f:
    patients = json.load(f)
    
    for i in range(len(sampleIds)):
        patients[i]["report_id"] = sampleIds[i]
    
    with open('new_data.json', 'w') as f:
        json.dump(patients, f)