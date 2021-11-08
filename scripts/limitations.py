import sys
import json
import requests

# script to test limiting results from query 1.

API_SEARCH = 'https://hpo.jax.org/api/hpo/search/?q='

def check_limitation_validity(limitation):
    if not limitation:
        return
    
    print(API_SEARCH + limitation)
    resp = requests.get(API_SEARCH + limitation)
    resp_res = resp.json()["terms"]
    
    # if invalid HPO term entered, allow user to reenter the term
    if len(resp_res) == 0 or resp.status_code == 404:
        new_input = input(limitation + " is an invalid HPO term, would you like to replace it? ")
        return check_limitation_validity(new_input)
    
    # if an exact match is found, return the match
    for r in resp_res:
        if limitation.lower() == r["name"].lower():
            return limitation
    
    # otherwise print all matches found to allow user to pick the correct term if inexact match is found
    print("The following input terms were found: ")
    
    for r in resp_res:
        print(r["name"])
    
    new_limits = input("Which of these terms were you interested in? Please enter the names separated by a comma, or press enter if none: ")
    
    new_limits = new_limits.split(",")
    new_limits = [l.strip(' ') for l in new_limits]
    
    print(new_limits)
    lim = []
    for n in new_limits:
        lim.append(check_limitation_validity(n))
        
    if len(lim) != 0:
        return lim
    
    return limitation

limitations = input("Do you want outputs to be limited by other phenotypes? Please enter HPO terms separated by a comma: ")
    
if (limitations != ""):
    limitations = limitations.split(",")
    limitations = [l.strip(' ') for l in limitations]
    print(limitations)
    
    # check if the term entered is valid
    final_limitations = []
    i = 0
        
    for limitation in limitations:
        lim = check_limitation_validity(limitation)
        if isinstance(lim, str) and lim is not None:
            final_limitations.append(lim)
        elif lim is not None:
            for l in lim:
                final_limitations.append(l)
        
    print(final_limitations)
    
