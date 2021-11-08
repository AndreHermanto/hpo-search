import sys
import json
import requests

# sample program to extract all HPO terms

# using the HPO api: documentation at https://hpo.jax.org/webjars/swagger-ui/3.20.9/index.html?url=/api/hpo/docs
API_URL = 'https://hpo.jax.org/api/hpo/term/'

# function to recursively search for children of an ontology
def get_children(curr_level, final_level, init_children):
    child = []
    if (curr_level < final_level):
        resp_children = []
        for c in init_children:
            print("Searching child: " + c["ontologyId"] + " " + c["name"])
            resp = requests.get(API_URL + c["ontologyId"])
            child.append(resp.json())
            resp_children.append(resp.json()["relations"]["children"])
        curr_level += 1
        if (curr_level != final_level):
            resp_children = list(filter(None, resp_children))
            for resp_c in resp_children:
                if resp_c:
                    res = get_children(curr_level, final_level, resp_c)
                    for r in res:
                        child.append(r)
        return child    
        
    if (curr_level == final_level):
        [child] = child
        return child

resp = requests.get(API_URL + "HP:0000001")
init_children = []
init_children = resp.json()["relations"]["children"]
result = get_children(0, 12, init_children)

with open("hpo.json", "w") as f:       
    json.dump(result, f, indent=4)