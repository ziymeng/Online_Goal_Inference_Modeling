class UpdatePosteriorClass:
  
  
    def __init__(self):
        self.priors = {'G1': 1/3, 'G2': 1/3, 'G3': 1/3}
        self.goals={'G1', 'G2', 'G3'}
        self.likelihoods = {
        'G1': {(1,0): 0.85, (-1,0): 0.05, (0,1): 0.05,(0,-1):0.05},
        'G2': {(1,0): 0.05, (-1,0): 0.85, (0,1): 0.05,(0,-1):0.05},
        'G3': {(1,0): 0.05, (-1,0): 0.05, (0,1): 0.85,(0,-1):0.05}
        }

    

    def get_posterior(self, pass_in_data_dict):
        action = pass_in_data_dict['action']
        posterior = {goal: self.likelihoods[goal][action] * self.priors[goal] for goal in self.priors}
        total = sum(posterior.values())
        normalized_posterior = {goal: posterior[goal] / total for goal in posterior}
        self.priors = normalized_posterior
        return normalized_posterior
    
    def __call__(self, pass_in_data_dic):
    # Assume passInDataDic should contain 'action' and 'position'
        action = pass_in_data_dic['action']
        position = pass_in_data_dic['position']
        return self.get_posterior({'action': action, 'position': position})



    
    

