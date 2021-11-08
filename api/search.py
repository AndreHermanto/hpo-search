
# The MIT License

# Copyright (c) 2021 Garvan, Alex Palmer & Stephanie Tong

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.


import os
import re
from typing import Counter

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, make_response, request

load_dotenv()

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')

# using the HPO api
# documentation at https://hpo.jax.org/webjars/swagger-ui/3.20.9/index.html?url=/api/hpo/docs
API_URL = 'https://hpo.jax.org/api/hpo/term/'
API_SEARCH = 'https://hpo.jax.org/api/hpo/search/?q='
VECTIS_URL = 'https://vsal.garvan.org.au/vsal/core/find'

datafiles = [
    os.getenv("PROJECT_ROOT") + "/HPO-Search/data/new_data.json",
    os.getenv("PROJECT_ROOT") + "/HPO-Search/data/data.json"
]

mappings = {"Mitochondria": "mito",
            "Acute Care": "acutecarepro", "Demo": "demo"}


@app.route('/')
def home():
    """Serve React frontend"""
    return app.send_static_file('index.html')


@app.errorhandler(404)
def not_found(error):
    '''Catch-all for React to handle'''
    print(error)
    return app.send_static_file('index.html')


@app.route("/hpo_search", methods=['GET', 'OPTIONS'])
def hpo_search():
    """Searches for HPO terms to use based on parameters"""
    # get filename and initial HPO term
    if request.method == "OPTIONS":  # CORS preflight
        return _build_cors_prelight_response()

    patients = []

    url = "http://{}:4001/neo4j/patients/with/".format(os.getenv("HOST_IP"))
    params = "{}?fuzz={}&cutoff={}&limitation={}".format(
        request.args["hpoTerm"].strip(),
        request.args["fuzz"].strip(),
        request.args["cutoff"].strip(),
        request.args["limitation"].strip())

    req = requests.get(url + params,
                       headers={"Authorization": request.headers.get("Authorization")}).json()

    for hpo in req["overall"]:
        for patient in hpo["patients"]:
            if patient not in patients:
                patients.append(patient)

    return {"overall_results": req["overall"], "patients": patients, "patient_info": patients, "results_per_dataset": req["perCohort"]}


def vectis_sample_search(cohort, request):
    '''Search Vectis for Variant'''
    variants = request.args['region']
    ch = []
    start = []
    end = []

    for region in variants.split(","):
        if " " in region:
            region = region.split(" ")[1]

        ch.append(region.split(':')[0])

        isRegion = re.search(
            "^([\dxy]+|mt+)[:\-.,\\/](\d+)[:\-.,\\/](\d+)$", region)
        if isRegion:
            start.append(region.split(":")[1].split("-")[0])
            end.append(region.split(":")[1].split("-")[1])
        else:
            start.append(region.split(":")[1])
            end.append(region.split(":")[1])

    ref_allele = None
    if request.args['ref']:
        ref_allele = request.args['ref']

    alt_allele = None
    if request.args['alt']:
        alt_allele = request.args['alt']

    params = {
        'chromosome': ",".join(ch),
        'positionStart': ",".join(start),
        'positionEnd': ",".join(end),
        'limit': 10000,
        'dataset': mappings[cohort],
        'het': True,
        'hom': True,
        'refAllele': ref_allele,
        'altAllele': alt_allele,
        'selectSamplesByGT': True,
        'conj': False
    }
    # call vectis to get patient IDs
    response = requests.get(VECTIS_URL, params=params, headers={
                            "Authorization": request.headers.get("Authorization")})
    response = response.json()
    print(response)
    return response


def vectis_variant_search(cohort, samples, request):
    '''Search Vectis for Variant'''
    variants = request.args['region']
    ch = []
    start = []
    end = []

    for region in variants.split(","):
        if " " in region:
            region = region.split(" ")[1]

        ch.append(region.split(':')[0])
        isRegion = re.search(
            "^([\dxy]+|mt+)[:\-.,\\/](\d+)[:\-.,\\/](\d+)$", region)
        if isRegion:
            start.append(region.split(":")[1].split("-")[0])
            end.append(region.split(":")[1].split("-")[1])
        else:
            start.append(region.split(":")[1])
            end.append(region.split(":")[1])

    ref_allele = None
    if request.args['ref']:
        ref_allele = request.args['ref']

    alt_allele = None
    if request.args['alt']:
        alt_allele = request.args['alt']

    params = {
        'chromosome': ",".join(ch),
        'positionStart': ",".join(start),
        'positionEnd': ",".join(end),
        'limit': 10000,
        'dataset': mappings[cohort],
        'samples': ",".join(samples),
        'het': True,
        'hom': True,
        'refAllele': ref_allele,
        'altAllele': alt_allele,
        'conj': False
    }
    # call vectis to get patient IDs
    response = requests.get(VECTIS_URL, params=params, headers={
        "Authorization": request.headers.get("Authorization")})
    response = response.json()

    return response


# variant search route
@ app.route("/variant_search", methods=['GET', 'OPTIONS'])
def variant_search():
    '''Search variants'''
    if request.method == "OPTIONS":  # CORS preflight
        return _build_cors_prelight_response()

    all_variants = []
    patients = []
    all_samples = []
    phenotypes = []
    per_cohorts = []
    clinical_db_url = "http://{}:4001/neo4j".format(os.getenv("HOST_IP"))
    genetrustee_url = "http://{}:4000/mappings/individual".format(
        os.getenv("HOST_IP"))

    available_cohorts = requests.get(
        clinical_db_url + "/cohorts",
        headers={"Authorization": request.headers.get("Authorization")}
    ).json()

    print(available_cohorts)

    keep = ['c', 'r', 'a', 's', 't']

    for cohort in available_cohorts:
        per_cohort = {"cohort": cohort, "patients": [],
                      "variants": [], "numPatients": 0, "phenotypes": []}

        if cohort == "Demo":
            continue

        matching_samples = vectis_sample_search(cohort, request)
        variants = vectis_variant_search(
            cohort, matching_samples["sampleIDs"], request)

        if not variants["v"]:
            continue

        for variant in variants["v"]:
            all_variants.append({k: variant[k] for k in keep})

        c = Counter()
        for sample in matching_samples["sampleIDs"]:
            all_samples.append(sample)

            gt_response = requests.get(genetrustee_url + "/" + sample, headers={
                                       "Authorization": request.headers.get("Authorization")}).json()
            clinicalId = gt_response["mapping"]["clinicalId"]

            patient_data = requests.get(
                clinical_db_url + "/patients/patient/" + clinicalId, headers={"Authorization": request.headers.get("Authorization")}).json()
            patients.append(patient_data)
            per_cohort["patients"].append(patient_data)

            for phenotype in patient_data["phenotypes"]:
                c[phenotype["label"]] += 1
                phenotypes.append(
                    {"name": phenotype["name"], "label": phenotype["label"]})
        a = dict(c)

        cohort_phenotypes = [{"id": k, "count": a[k]} for k in a]
        per_cohort["phenotypes"] = cohort_phenotypes
        per_cohort["variants"] = variants["v"]
        per_cohort["numPatients"] = len(matching_samples["sampleIDs"])
        per_cohorts.append(per_cohort)

    c = Counter()
    for phenotype in phenotypes:
        c[phenotype["label"]] += 1

    cutoff = int(request.args["cutoff"])
    pheno_count = {k: v for k, v in c.items() if v >= cutoff}

    all_variants = [dict(t) for t in {tuple(d.items()) for d in all_variants}]

    return {"patient_info": patients, "phenotype_count": pheno_count, "total_patients": len(patients), "variants": all_variants, "per_cohort": per_cohorts}


# route to get patients
@ app.route("/patient", methods=['GET', 'OPTIONS'])
def patient_search():
    '''Search for specific patient from patient id query parameter'''
    if request.method == "OPTIONS":  # CORS preflight
        return _build_cors_prelight_response()

    patient_id = request.args['id']

    patient = requests.get(
        "http://{}:4001/neo4j/patients/patient/{}".format(os.getenv("HOST_IP"), patient_id), headers={"Authorization": request.headers.get("Authorization")}).json()
    similarPatients = requests.get(
        "http://{}:4001/neo4j/patients/like/{}?fuzz=2".format(os.getenv("HOST_IP"), patient_id), headers={"Authorization": request.headers.get("Authorization")}).json()

    patient["similarPatients"] = similarPatients["overall"]

    return patient


@ app.route("/mapping", methods=['GET', 'OPTIONS'])
def get_mapping():
    '''Get GT mapping of patient'''
    if request.method == "OPTIONS":  # CORS preflight
        return _build_cors_prelight_response()

    patient_id = request.args['id']

    req = requests.get(
        "http://{}:4000/mappings/individual/".format(os.getenv("HOST_IP")) + patient_id, headers={"Authorization": request.headers.get("Authorization")}).json()

    return jsonify(req)


@ app.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response


def _build_cors_prelight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3003)
