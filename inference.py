import numpy as np
from ValueIteration import BellmanUpdate, ValueIteration, GetPolicy

class GoalInferenceMap:
    def __init__(self, environment, goal):
        self.environment = environment
        self.goal = goal
        self.stateSpace = []
        self.actionSpace = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        self.policy = {}


    def getMapPolicy(self, stateSpace, actionSpace, transitionFunction, rewardFunction, gamma, theta):
        actionSpaceFunction = lambda s: actionSpace
        bellmanUpdate = BellmanUpdate(stateSpace, actionSpaceFunction, transitionFunction, rewardFunction, gamma)
        V = {s: 0 for s in stateSpace}
        valueIteration = ValueIteration(stateSpace, theta, bellmanUpdate)
        V = valueIteration(V)

        getPolicy = GetPolicy(stateSpace, actionSpaceFunction, transitionFunction, rewardFunction, gamma, V, theta)
        policy = {s: getPolicy(s) for s in stateSpace}
        self.policy = policy

    def getGoalActionLikelihood(self, state, action):
        likelihood = 0
        if state in self.policy:
            action_probs = self.policy[state]
            if action in action_probs:
                likelihood = action_probs[action]
        return likelihood
    
def transitionFunctionMDPFullWalls(s, a, sPrime, minX,minY, maxX, maxY, environment):
    if s in environment:
        return 1 * (s == sPrime)
    x, y = s
    dx, dy = a
    xPrime, yPrime = (x + dx, y + dy)
    if xPrime < minX or xPrime > maxX:
        xPrime = x
    if yPrime < minY or yPrime > maxY:
        yPrime = y
    return 1 * ((xPrime, yPrime) == sPrime)

def rewardFunctionMDPFull(s, sPrime, goal, navigationCost, goalReward, trapReward, environment):
    if s in environment:
        return 0
    elif sPrime == goal:
        return goalReward
    elif sPrime in environment:
        return trapReward
    else:
        return navigationCost
    
def convertRep(customMap):
    goals = customMap['goals']
    blocks = customMap['blocks']
    maps = []
    for goal in goals:
        map_rep = {
            "blocks": blocks,
            "walls": [],
            "goal": goal
        }
        maps.append(map_rep)
    return maps

class UpdatePosteriorClass:
    def __init__(self,customMap):
        self.priors = {'G1': 1/3, 'G2': 1/3, 'G3': 1/3}
        maps = convertRep(customMap)
        goalInferenceMaps = {}
        
        minX,minY = 0,0
        maxX, maxY = 9, 9
        navigationCost = -5
        goalReward = 100
        trapReward = -100
        gamma = 1
        theta = 1e-4

        stateSpace = [(x, y) for x in range(maxX + 1) for y in range(maxY + 1)]
        actionSpace = [(0, 1), (1, 0), (0, -1), (-1, 0)]

        for idx, mapData in enumerate(maps):
            environment = mapData['blocks'] + [mapData['goal']]
            goal = mapData['goal']

            gim = GoalInferenceMap(environment, goal)
            
            gim.getMapPolicy(stateSpace, actionSpace, 
                             lambda s, a, sPrime: transitionFunctionMDPFullWalls(s, a, sPrime, minX,minY,maxX, maxY, environment), 
                             lambda s, a, sPrime: rewardFunctionMDPFull(s, sPrime, goal, navigationCost, goalReward, trapReward, environment), 
                             gamma, theta)
            
            goalInferenceMaps[f'G{idx+1}'] = gim
        self.goalInferenceMaps = goalInferenceMaps
    
    def __call__(self, stateAfterAction, action):
        state = tuple(np.array(stateAfterAction)-np.array(action))
        posterior = {goal: self.getGoalLikelihood(goal, state, action) * self.priors[goal] for goal in self.priors}
        total = sum(posterior.values())
        normalizedPosterior = {goal: posterior[goal] / total for goal in posterior}
        self.priors = normalizedPosterior
        return normalizedPosterior
    
    def getGoalLikelihood(self, goal, state, action):
        gim = self.goalInferenceMaps[goal]
        return gim.getGoalActionLikelihood(state, action)
    

if __name__ == "__main__":

    customMap = {
    'playerPosition': (0, 0),
    'goals': [(9, 0), (9, 4), (9, 9)],
    'blocks': [(4, 0), (4, 1), (7, 1), (4, 3), (4, 4), (7, 4), (7, 5), (6, 6), (6, 7), (6, 8)]
    }
    updatePosterior = UpdatePosteriorClass(customMap)

    state = (5, 5)
    action = (1, 0)
    posterior = updatePosterior(state, action)
    print(f"Updated posterior: {posterior}")