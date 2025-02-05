import numpy as np
from scipy.special import softmax

class BellmanUpdate(object):
    
    def __init__(self, stateSpace, actionSpaceFunction, transitionFunction, rewardFunction, gamma):
        self.stateSpace=stateSpace
        self.actionSpaceFunction=actionSpaceFunction
        self.transitionFunction=transitionFunction
        self.rewardFunction=rewardFunction
        self.gamma=gamma

    def __call__(self, s, V):
        Qs={a: sum([self.transitionFunction(s, a, sPrime)*(self.rewardFunction(s, a, sPrime)+self.gamma*V[sPrime]) for sPrime in self.stateSpace])\
            for a in self.actionSpaceFunction(s)}
        Vs=max(Qs.values())
        return Vs


class ValueIteration(object):
    
    def __init__(self, stateSpace, theta, bellmanUpdate):
        self.stateSpace=stateSpace
        self.theta=theta
        self.bellmanUpdate=bellmanUpdate

        
    def __call__(self, V):
        #V={state:0 for state in self.stateSpace}
        delta=np.inf
        while (delta > self.theta):
            delta=0
            for s in self.stateSpace:
                v=V[s]
                V[s]=self.bellmanUpdate(s, V)
                delta=max(delta, abs(v-V[s]))
        return V
    
    
class GetPolicy(object):
    
    def __init__(self, stateSpace, actionSpaceFunction, transitionFunction, rewardFunction, gamma, V, roundingTolerance, temperature=5):
        self.stateSpace=stateSpace
        self.actionSpaceFunction=actionSpaceFunction
        self.transitionFunction=transitionFunction
        self.rewardFunction=rewardFunction
        self.gamma=gamma
        self.V=V
        self.roundingTolerance=roundingTolerance
        self.temperature=temperature
        
    def __call__(self, s):
        Qs={a: sum([self.transitionFunction(s, a, sPrime)*(self.rewardFunction(s, a, sPrime)+self.gamma*self.V[sPrime]) for sPrime in self.stateSpace])\
            for a in self.actionSpaceFunction(s)}
        # optimalActionList=[a for a in self.actionSpaceFunction(s) if abs(Qs[a]-max(Qs.values())) < self.roundingTolerance]
        # policy={a: 1/(len(optimalActionList)) for a in optimalActionList}
        QValues = np.array(list(Qs.values()))
        QValues = QValues / self.temperature
        probabilities = softmax(QValues)
        policy = {a: probabilities[i] for i, a in enumerate(Qs.keys())}
        return policy
