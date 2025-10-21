from typing import Callable
import itertools

import numpy as np


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

        self.outcome_to_index = {}
        self.index_to_outcome = []
        self.coef_array = np.zeros(2 ** (self.n_probs))
        self.outcome_array = np.zeros((2 ** (self.n_probs), self.n_probs))
        for i, outcome in enumerate(
            itertools.product([False, True], repeat=self.n_probs)
        ):
            self.index_to_outcome.append(outcome)
            self.outcome_to_index[outcome] = i
            self.outcome_array[i, :] = np.array(outcome)
            if outcome in coefs:
                self.coef_array[i] = coefs[outcome]

        self.terms = coefs

    def _poly_eval(
        self, probs: np.ndarray, outcome_array: np.ndarray, coef_array: np.ndarray
    ) -> float:
        n_probs = len(probs)

        relevant_probs = probs.reshape((1, n_probs)) * outcome_array + (
            1 - probs
        ).reshape((1, n_probs)) * (1 - outcome_array)
        return np.sum(np.prod(relevant_probs, axis=1) * coef_array)

    def eval(self, probs: np.ndarray) -> float:
        if len(probs) != self.n_probs:
            raise OutcomePolynomialException("Supplied probabilities have wrong length")

        return self._poly_eval(probs, self.outcome_array, self.coef_array)

    def deriv(self, probs: np.ndarray) -> np.ndarray:
        if len(probs) != self.n_probs:
            raise OutcomePolynomialException("Supplied probabilities have wrong length")

        partial_derivs = []
        mask = np.full(self.n_probs, True)
        for i in range(self.n_probs):
            mask[i] = False
            deriv_coefs = self.coef_array * (self.outcome_array[:, i] * 2 - 1)
            partial_derivs.append(
                self._poly_eval(
                    probs[mask],
                    self.outcome_array[:, mask],
                    deriv_coefs,
                )
            )
            mask[i] = True

        return np.array(partial_derivs)

    def __add__(self, other_polynomial):
        summed_coefs = {}
        for terms in (self.terms, other_polynomial.terms):
            for k in terms:
                if k not in summed_coefs:
                    summed_coefs[k] = 0.0
                summed_coefs[k] += terms[k]

        return OutcomePolynomial(summed_coefs)


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


class PlayerValue:
    """Player's value function for the Lame duck game played on show.
    Allow arbitrary conversion factor between £25 and points.
    """

    N_PLAYERS = 5

    def __init__(self, cash_to_points_conversion: float):
        self.cash_to_points_conversion = cash_to_points_conversion

    def eat_value(self, n_eaten: int) -> float:
        if n_eaten == 0:
            return 6
        elif n_eaten == 1:
            return -1 * ((3 * 6) / 4)
        elif n_eaten == 2:
            return -1 * ((2 * 6) / 4)
        elif n_eaten == 3:
            return -1 * (6 / 4)
        elif n_eaten == 4:
            return self.cash_to_points_conversion
        else:
            raise ValueError("n_eaten does not have allowed value")

    def not_eat_value(self, n_eaten: int) -> float:
        if n_eaten == 0:
            return -1 * self.cash_to_points_conversion
        elif n_eaten == 1:
            return -1 * (6 / 4)
        elif n_eaten == 2:
            return (2 * 6) / 4
        elif n_eaten == 3:
            return (3 * 6) / 4
        elif n_eaten == 4:
            return 6
        else:
            raise ValueError("n_eaten does not have allowed value")


def equal_value_eqn(
    n_probs: int, value_a: Callable[[int], float], value_b: Callable[[int], float]
) -> OutcomePolynomial:
    return create_value_polynomial(n_probs, value_a) + create_value_polynomial(
        n_probs,
        lambda x: -1 * value_b(x),
    )


def newton_rhapson_prep(
    lhs: list[OutcomePolynomial], all_probs: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """Given an eqn of form lhs=0, with ith eqn having ith prob ommitted, return the derivative matrix
    and rhs vector for NR linear solve step.
    """

    vec_elements = []
    deriv_rows = []
    mask = np.full(len(all_probs), True)
    for i, lhs_row in enumerate(lhs):
        mask[i] = False
        relevant_probs = all_probs[mask]
        vec_elements.append(-1 * lhs_row.eval(relevant_probs))
        deriv_row = lhs_row.deriv(relevant_probs)
        deriv_row_list = list(deriv_row[:i]) + [0.0] + list(deriv_row[i:])
        deriv_rows.append(deriv_row_list)

        mask[i] = True

    return np.array(deriv_rows), np.array(vec_elements)


def create_equations_from_values(
    cash_to_points_conversions: list[int],
) -> list[OutcomePolynomial]:
    player_values = [
        PlayerValue(conversion) for conversion in cash_to_points_conversions
    ]
    return [
        equal_value_eqn(
            len(player_values) - 1,
            player.eat_value,
            player.not_eat_value,
        )
        for player in player_values
    ]


def solve(
    cash_to_points_conversions: list[int],
    starting_probs: np.ndarray,
    tolerance: float = 10 ** (-6),
) -> np.ndarray:
    eqns = create_equations_from_values(cash_to_points_conversions)
    soln = np.copy(starting_probs)

    while True:
        deriv, rhs = newton_rhapson_prep(eqns, soln)
        if np.all(np.abs(rhs) < tolerance):
            break
        update = np.linalg.solve(deriv, rhs)
        soln += update

    return soln
