from typing import Callable
import itertools


class ValuePolynomialException(Exception):
    pass


# TODO: Refactor so polynomial class has generic constructor (can be polynomial with generic coefficients, where each term is
# products of p or (1-p) with p the free probabilities). Have current init as a special case class function.
# Can then use this to do addition, which I will need. Also convert self.terms to dict to help with this!


class ValuePolynomial:
    def __init__(
        self,
        fixed_probs: list[float],
        n_free_probs: int,
        value_function: Callable[[int], float],
    ):
        self.n_free_probs = n_free_probs
        self.terms = []

        for outcome in itertools.product(
            [False, True], repeat=len(fixed_probs) + n_free_probs
        ):
            n_eaten = sum(outcome)
            coef = value_function(n_eaten)
            for i, p in enumerate(fixed_probs):
                if outcome[i]:
                    coef *= p
                else:
                    coef *= 1 - p

            self.terms.append((coef, outcome[len(fixed_probs) :]))

    def eval(self, probs: list[float]) -> float:
        if len(probs) != self.n_free_probs:
            raise ValuePolynomialException("Supplied probabilities have wrong length")

        result = 0.0

        for term in self.terms:
            term_val = term[0]
            for i, sel in enumerate(term[1]):
                if sel:
                    term_val *= probs[i]
                else:
                    term_val *= 1 - probs[i]

            result += term_val

        return result

    # TODO: Function for calculating derivative w.r.t each free prob
    def deriv(self, probs: list[float]) -> list[float]:
        pass
