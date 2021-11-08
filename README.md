# HPO Search

An application designed for researchers and clinicians to intersect patient data with Human Phenotype Ontology (HPO) terms as a form of clinical filtering, in order to increase efficiency and usefulness of research.

It has been designed to satisfy two queries:

* Starting with a phenotypic input, find all patients with the same or related phenotype and return the variants which these patients have in common.
* Starting with a variant input, find all patients with that variant and return the phenotypes which are common within these patients

Please note, when running this program, you will need to change the location of the data at ```api/search.py``` on lines 14-17.

## How to run this program

```
git clone git@github.com:stephtong/HPO-Search.git
```

### API Dependencies

#### Install Python packages

```
pip3 install sys json requests flask copy
```

## Running the API

In a terminal, enter the following commands when in the HPO-search directory:

```
cd api
python3 search.py
```

## Running the frontend

### Running the frontend for the first time

Ensure that Yarn is installed.

```
https://yarnpkg.com
```

In a terminal, enter the following commands when in the HPO-search directory:

```
cd frontend
yarn
yarn start
```

## Running the frontend

In a terminal, enter the following commands when in the HPO-search directory:

```
cd frontend
yarn start
```