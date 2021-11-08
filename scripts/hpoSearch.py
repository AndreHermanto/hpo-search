import sys
import json
import requests

# python pipeline application to search parents/children of an inputted HPO term.

# using the HPO api: documentation at https://hpo.jax.org/webjars/swagger-ui/3.20.9/index.html?url=/api/hpo/docs
API_URL = 'https://hpo.jax.org/api/hpo/term/'
API_SEARCH = 'https://hpo.jax.org/api/hpo/search/?q='

def main():
    if len(sys.argv) == 1 or len(sys.argv) < 3:
        print("usage: python3 HPOSearch.py <file.json> <HPO-term>")
        exit(1)

    if sys.argv[1] == "-help":
        print("help")
        exit(1)

    # get filename and initial HPO term 
    filename = sys.argv[1]
    search_terms = []
    
    for i in range(2, len(sys.argv)):
        HPOterm = sys.argv[i]
        print("Searching term: " + HPOterm)
        
        # check if input is valid
        init_response = requests.get(API_URL + HPOterm)
        if init_response.status_code == 404:
            print(HPOterm + " is an invalid HPO term")
            continue

        # create an array of search terms
        search_terms.append(HPOterm)

        # if there is an upstream or downstream value, then send request to HPO api and get
        # children and parent values
        upstream = int(input("How many levels of ancestors do you wish to search? "))

        if (upstream != 0):
            print("Searching for up stream ontologies")
            # store parent value of initial HPO term
            init_parent = init_response.json()["relations"]["parents"]

            for parent in init_parent:
                print("Adding " + parent["ontologyId"] + " " + parent["name"])
                search_terms.append(parent["ontologyId"])
            
            if (upstream > 1):
                # get parents
                curr_parents = []
                curr_parents.append(get_parents(0, upstream, init_parent))
                [curr_parents] = curr_parents
                curr_parents = list(filter(None, curr_parents))
                for p in curr_parents:
                    search_terms.append(p["ontologyId"])

        downstream = int(input("How many levels of descendents do you wish to search? "))

        if (downstream != 0):
            print("Searching for down stream ontologies")
            
            # store children values of initial HPO term and append to search terms
            init_children = init_response.json()["relations"]["children"]
            
            for child in init_children:
                print("Adding " + child["ontologyId"] + " " + child["name"])
                search_terms.append(child["ontologyId"])
            
            if (downstream > 1):  
                # get children  
                curr_children = []
                curr_children.append(get_children(0, downstream, init_children))
                [curr_children] = curr_children
                curr_children = list(filter(None, curr_children))
                for c in curr_children:
                    search_terms.append(c["ontologyId"])

        # if you want the same level search
        same_level = int(input("Do you wish to search for all siblings? Enter 1 for yes, 0 for no. "))

        if (same_level != 0):
            print("Searching for same level ontologies")
            
            # store parent value of initial HPO term
            init_parent = init_response.json()["relations"]["parents"]
            
            # get all parents of the initial HPO term
            parents = []
            for parent in init_parent:
                parents.append(parent["ontologyId"])
            
            # iterate through parents and append children of each parent to search terms array
            for p in parents:   
                parent_response = requests.get(API_URL + p)
                
                # get each child response
                children = parent_response.json()["relations"]["children"]
                for child in children:
                    print("Adding search term " + child["ontologyId"] + " " + child["name"])
                    search_terms.append(child["ontologyId"])

    # exit if no search terms found i.e. if all input given was invalid
    if len(search_terms) == 0:
        exit(1)
    
    # remove duplicates in search_terms array
    search_terms = list(dict.fromkeys(search_terms))
    print("Search terms found: ")
    print(search_terms)
    
    # get matches
    matches = []
    num_patients = 0
    with open(filename) as f:
        patients = json.load(f)
        num_patients = len(patients)
        for term in search_terms:
            curr_term = {"id": term, "patients": []}
            for patient in patients:
                for feature in patient["features"]:
                    if term == feature["id"]:
                        curr_term["patients"].append(patient["report_id"])
            matches.append(curr_term)
    
    # allows you to limit search via phenotypes i.e. get results that also have 'clubbing of the fingers'
    limitations = input("Do you want outputs to be limited by other phenotypes? Please enter HPO terms separated by a comma: ")
    
    if limitations != "":
        limitations = limitations.split(",")
        limitations = [l.strip(' ') for l in limitations]
        
        # check if the term entered is valid
        final_limitations = []
        
        for limitation in limitations:
            lim = check_limitation_validity(limitation)
            if isinstance(lim, str):
                final_limitations.append(lim)
            elif lim:
                for l in lim:
                    if l is not None:
                        final_limitations.append(l)
        
        if len(final_limitations) != 0:
            match_all_limitations = int(input("Do you only want outputs which match all limitations (enter 1), or any limitation (enter 0)? "))
            
            # gets all limitations 
            if match_all_limitations == 1:
                # check if valid HPO term:
                for match in matches:
                    curr_matches = []
                    for m in match["patients"]:
                        for patient in patients:
                            if patient["report_id"] == m:
                                match_all = 0
                                for feature in patient["features"]:
                                    for l in final_limitations:
                                        if l.lower() == feature["label"].lower():
                                            match_all += 1
                                            break
                                if match_all == len(final_limitations):
                                    curr_matches.append(patient["report_id"])
                    match["patients"] = curr_matches
            else:
                for match in matches:
                    curr_matches = []
                    for m in match["patients"]:
                        for patient in patients:
                            if patient["report_id"] == m:
                                for feature in patient["features"]:
                                    for l in final_limitations:
                                        if l.lower() == feature["label"].lower():
                                            curr_matches.append(patient["report_id"])
                                            break                             
                    # remove duplicates
                    curr_matches = list(dict.fromkeys(curr_matches))
                    match["patients"] = curr_matches

    intersection = int(input("Do you want outputs to be displayed only if they are in every patient? Enter 1 for yes, 0 for no. "))
    
    print_matches = []
    matches = sort_into_array(matches)
    
    # return intersection of all variants
    if intersection != 0:
        for match in matches:
            if match["num_matches"] == num_patients:
                print_matches.append(match)
        with open("output.json", "w") as f:
            json.dump(print_matches, f, indent=4)
            exit(1)

    # allow user to cut off results at a certain number of matches
    cutoff_value = int(input("Enter the cutoff value, or 0 if you do not wish to have a cutoff value. "))
    descending_order = int(input("Do you want outputs to be displayed in descending order? Enter 1 for yes, 0 for no. "))
    
    if cutoff_value != 0:
        if descending_order != 0:
            temp = sorted(matches, key=lambda matches:matches["num_matches"], reverse=True)
        else:
            temp = matches
            
        for t in temp:
            if t["num_matches"] >= cutoff_value:
                print_matches.append(t)
    
        with open("output.json", "w") as f:
            json.dump(print_matches, f, indent=4)
            exit(1)
    
    if descending_order != 0:
        print_matches = sorted(matches, key=lambda matches:matches["num_matches"], reverse=True)
        with open("output.json", "w") as f:
            json.dump(print_matches, f, indent=4)
            exit(1)

    with open("output.json", "w") as f:       
        json.dump(matches, f, indent=4)

# function to recursively search for parents of an ontology
def get_parents(curr_level, final_level, init_parents):
    parents = []
    
    if (curr_level < final_level):
        resp_parents = []
        for p in init_parents:
            parents.append(p)
            print("Adding " + p["ontologyId"] + " " + p["name"])
            resp = requests.get(API_URL + p["ontologyId"])
            resp_parents.append(resp.json()["relations"]["parents"])
        curr_level += 1
        if (curr_level != final_level):
            resp_parents = list(filter(None, resp_parents))
            for resp_p in resp_parents:
                curr = get_parents(curr_level, final_level, resp_p)
                for c in curr:
                    parents.append(c)
        return parents    
        
    if (curr_level == final_level):
        [parents] = parents
        return parents

# function to recursively search for children of an ontology
def get_children(curr_level, final_level, init_children):
    child = []
    if (curr_level < final_level):
        resp_children = []
        for c in init_children:
            child.append(c)
            print("Adding: " + c["ontologyId"] + " " + c["name"])
            resp = requests.get(API_URL + c["ontologyId"])
            resp_children.append(resp.json()["relations"]["children"])
        curr_level += 1
        if (curr_level != final_level):
            resp_children = list(filter(None, resp_children))
            for resp_c in resp_children:
                curr = get_children(curr_level, final_level, resp_c)
                for c in curr:
                    child.append(c)
        return child    
        
    if (curr_level == final_level):
        [child] = child
        return child

# function to recursively determine the validity of a HPO term entered
def check_limitation_validity(limitation):
    if not limitation: 
        return 
    
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
    
    lim = []
    for n in new_limits:
        lim.append(check_limitation_validity(n))
        
    if len(lim) != 0:
        return lim
    
    return limitation
 
# function to sort matches into arrays based on number of matches
def sort_into_array(matches):
    retVal = []
    
    for match in matches:
        currVal = len(match["patients"])
        if len(retVal) == 0:
            retVal.append({"result": [match], "num_matches": currVal})
        else:
            for r in retVal:
                hits = 0
                if (r["num_matches"] == len(match["patients"])):
                    r["result"].append(match)
                    hits = 1
                    break
            if hits == 0:
                retVal.append({"result": [match], "num_matches": currVal})
    
    return retVal        
   
if __name__ == "__main__":
    main()