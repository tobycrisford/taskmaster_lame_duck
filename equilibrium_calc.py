from typing import Callable
import itertools


class OutcomePolynomialException(Exception):
    pass


class OutcomePolynomial:
    def __init__(self, coefs: dict[tuple[bool, ...], float]):
        self.n_probs = -1
        for k in coefs:
            if self.n_probs == -1:
                self.n_probs = len(k)
            if len(k) != self.n_probs:
                raise OutcomePolynomialException(
                    "Inconsistent lengths among supplied coefficients"
                )

        if self.n_probs < 0:
            raise OutcomePolynomialException("No coefficients supplied")

        self.terms = coefs

    def eval(self, probs: list[float]) -> float:
        if len(probs) != self.n_probs:
            raise OutcomePolynomialException("Supplied probabilities have wrong length")

        result = 0.0

        for outcome, coef in self.terms.items():
            term_val = coef
            for i, sel in enumerate(outcome):
                if sel:
                    term_val *= probs[i]
                else:
                    term_val *= 1 - probs[i]

            result += term_val

        return result

    # TODO: Function for calculating derivative w.r.t each free prob
    def deriv(self, probs: list[float]) -> list[float]:
        pass


def create_value_polynomial(
    n_probs: int,
    value_function: Callable[[int], float],
) -> OutcomePolynomial:
    coefs = {}

    for outcome in itertools.product([False, True], repeat=n_probs):
        n_eaten = sum(outcome)
        coef = value_function(n_eaten)

        coefs[outcome] = coef

    return OutcomePolynomial(coefs)
