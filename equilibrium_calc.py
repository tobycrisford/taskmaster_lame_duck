from typing import Callable, Iterable, Sequence
import itertools

import numpy as np
from tqdm import tqdm

DEFAULT_TOLERANCE = 10 ** (-6)


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
) -> tuple[list[OutcomePolynomial], list[OutcomePolynomial], list[OutcomePolynomial]]:
    """Return equations to be solved, along with value equations for each player."""

    player_values = [
        PlayerValue(conversion) for conversion in cash_to_points_conversions
    ]
    equal_value_eqns = [
        equal_value_eqn(
            len(player_values) - 1,
            player.eat_value,
            player.not_eat_value,
        )
        for player in player_values
    ]
    eat_value_polynomial = [
        create_value_polynomial(len(player_values) - 1, player.eat_value)
        for player in player_values
    ]
    not_eat_value_polynomial = [
        create_value_polynomial(len(player_values) - 1, player.not_eat_value)
        for player in player_values
    ]

    return equal_value_eqns, eat_value_polynomial, not_eat_value_polynomial


class NRConvergenceError(Exception):
    pass


def solve(
    cash_to_points_conversions: list[int],
    starting_probs: np.ndarray,
    tolerance: float = DEFAULT_TOLERANCE,
    iteration_limit: int = 1000,
    exclude_indices: Iterable[int] | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Find probabilities that solve equilibrium equations, along with value of game for each player."""

    mask = np.full(len(starting_probs), True)
    if exclude_indices is not None:
        for idx in exclude_indices:
            mask[idx] = False

    eqns, eat_value_polys, not_eat_value_polys = create_equations_from_values(
        cash_to_points_conversions
    )

    soln = np.copy(starting_probs)

    soln_found = False
    for _ in range(iteration_limit):
        deriv, rhs = newton_rhapson_prep(eqns, soln)
        if np.all(np.abs(rhs[mask]) < tolerance):
            soln_found = True
            break
        update = np.linalg.solve(deriv[mask][:, mask], rhs[mask])
        soln[mask] += update

    if not soln_found:
        raise NRConvergenceError(
            f"Solution did not converge in {iteration_limit} iterations."
        )

    _, eat_values = newton_rhapson_prep(eat_value_polys, soln)
    eat_values *= -1.0

    _, not_eat_values = newton_rhapson_prep(not_eat_value_polys, soln)
    not_eat_values *= -1.0

    return soln, eat_values, not_eat_values


class EquilibriumCalcException(Exception):
    pass


def find_all_potential_solutions(
    cash_to_points_conversions: list[int],
    fixed_zeros: Sequence[int],
    fixed_ones: Sequence[int],
    n_trials: int = 100,
    tolerance: float = DEFAULT_TOLERANCE,
) -> list[tuple[np.ndarray, np.ndarray, np.ndarray]]:
    exclude_indices = set(fixed_ones).union(set(fixed_zeros))
    if len(exclude_indices) < len(fixed_ones) + len(fixed_zeros):
        raise EquilibriumCalcException("Overlap between fixed ones and fixed zeros")

    solns: list[tuple[np.ndarray, np.ndarray, np.ndarray]] = []
    for _ in range(n_trials):
        initialization_vec = np.random.rand(len(cash_to_points_conversions))
        for idx in fixed_zeros:
            initialization_vec[idx] = 0.0
        for idx in fixed_ones:
            initialization_vec[idx] = 1.0
        try:
            soln, eat_value, not_eat_value = solve(
                cash_to_points_conversions,
                initialization_vec,
                exclude_indices=exclude_indices,
            )
        except (np.linalg.LinAlgError, NRConvergenceError):
            # Occurs when matrix is singular
            continue
        if np.any(soln > 1.0 + tolerance) or np.any(soln < 0.0 - tolerance):
            continue
        if any(
            np.all(np.abs(soln - existing_soln) < tolerance)
            for existing_soln, __, ___ in solns
        ):
            continue
        solns.append((soln, eat_value, not_eat_value))

    return solns


def find_all_valid_solutions(
    cash_to_points_conversions: list[int], tolerance: float = DEFAULT_TOLERANCE
) -> list[tuple[np.ndarray, np.ndarray, np.ndarray]]:
    valid_solns = []
    for boundary_region in tqdm(
        itertools.product([None, 0, 1], repeat=PlayerValue.N_PLAYERS),
        total=3**PlayerValue.N_PLAYERS,
    ):
        fixed_zeros = []
        fixed_ones = []
        for idx, val in enumerate(boundary_region):
            if val == 0:
                fixed_zeros.append(idx)
            elif val == 1:
                fixed_ones.append(idx)

        solns = find_all_potential_solutions(
            cash_to_points_conversions, fixed_zeros, fixed_ones
        )

        for soln, eat_value, not_eat_value in solns:
            valid = True
            if any(
                eat_value[idx] > not_eat_value[idx] + tolerance for idx in fixed_zeros
            ):
                valid = False
            elif any(
                not_eat_value[idx] > eat_value[idx] + tolerance for idx in fixed_ones
            ):
                valid = False

            if valid:
                valid_solns.append((soln, eat_value, not_eat_value))

    return valid_solns
