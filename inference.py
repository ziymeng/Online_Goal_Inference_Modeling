class UpdatePosteriorClass:
  
  
    def __init__(self):
        self.priors = {'G1': 1/3, 'G2': 1/3, 'G3': 1/3}
        self.goals={'G1', 'G2', 'G3'}
        self.likelihoods = {
        'G1': {(1,0): 0.40, (-1,0): 0.10, (0,1): 0.40,(0,-1):0.10},
        'G2': {(1,0): 0.18, (-1,0): 0.01, (0,1): 0.80,(0,-1):0.01},
        'G3': {(1,0): 0.80, (-1,0): 0.01, (0,1): 0.18,(0,-1):0.1}
        }

    
    def __call__(self, action):
        posterior = {goal: self.likelihoods[goal][action] * self.priors[goal] for goal in self.priors}
        total = sum(posterior.values())
        normalized_posterior = {goal: posterior[goal] / total for goal in posterior}
        self.priors = normalized_posterior
        return normalized_posterior

    
    

