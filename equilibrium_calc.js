// My attempt at translating equilibrium_calc.py to javascript, with limited javascript knowledge!

function* generate_all_outcomes(n_players) {

    function* _generate_all_outcomes(current, current_outcome) {
        if (current > n_players) {
            throw new Error('n_players must be a positive integer')
        }
        if (current === n_players) {
            yield [...current_outcome];
        } else {
            current_outcome.push(true);
            yield* backtrack(current + 1, current_outcome);
            current_outcome.pop();
            current_outcome.push(false);
            yield* backtrack(current + 1, current_outcome);
            current_outcome.pop();
        }
    }

    yield* _generate_all_outcomes(0, []);
}

class OutcomePolynomial {
    constructor(outcome_array, coef_array) {
        if (this.outcome_array.length !== this.coef_array.length) {
            throw new Error('Outcome array and coefficient array have inconsistent shapes')
        }
        this.coef_array = coef_array;
        this.outcome_array = outcome_array;
    }

    _poly_eval(probs, mask, coef_array) {
        if (this.outcomes.length !== coef_array.length) {
            throw new Error('Outcome and coefficient array lengths are inconsistent');
        }
        if (mask.length !== probs.length) {
            throw new Error('Mask length is inconsistent with probs')
        }
        let result = 0.0;
        for (let j = 0;j < coef_array.length;j++) {
            if (!(mask[j])) {
                continue;
            }
            if (this.outcomes[j].length !== probs.length) {
                throw new Error('Bad outcome length');
            }
            let prob = 1.0;
            for (let i = 0;i < probs.length;i++) {
                if (outcomes[j][i]) {
                    prob *= probs[i];
                }
                else {
                    prob *= 1 - probs[i];
                }
            }
            result += coef_array[j] * prob;
        }
        return result;
    }

    eval(probs) {
        return this._poly_eval(probs, Array(probs.length).fill(true), this.coef_array);
    }

    deriv(probs) {
        const partial_derivs = [];
        mask = Array(probs.length).fill(true);
        for (let i = 0;i < probs.length;i++) {
            mask[i] = false;
            let deriv_coefs = [...this.coef_array];
            for (let j = 0;j < this.outcomes.length;j++) {
                if (!outcomes[j][i]) {
                    deriv_coefs[j] *= -1;
                }
            }
            partial_derivs.push(
                this._poly_eval(probs, mask, deriv_coefs)
            );
            mask[i] = true;
        }
        return partial_derivs;
    }
}

function create_value_polynomial(n_probs, value_function) {
    const coefs = [];
    const outcomes = [];
    for (const outcome of generate_all_outcomes(n_probs)) {
        let n_eaten = 0;
        for (const decision of outcome) {
            if (decision) {
                n_eaten += 1;
            }
        }
        coefs.push(value_function(n_eaten));
        outcomes.push(outcome);
    }
    return new OutcomePolynomial(outcomes, coefs);
}

class PlayerValue {
    static N_PLAYERS = 5;

    constructor(cash_to_points_conversion) {
        this.cash_to_points_conversion = cash_to_points_conversion;
    }

    eat_value(n_eaten) {
        if (n_eaten === 0) {
            return 6;
        }
        else if (n_eaten === 1) {
            return -1 * ((3 * 6) / 4);
        }
        else if (n_eaten === 2) {
            return -1 * ((2 * 6) / 4);
        }
        else if (n_eaten === 3) {
            return -1 * (6 / 4);
        }
        else if (n_eaten === 4) {
            return this.cash_to_points_conversion;
        }
        else {
            throw new Error('n_eaten does not have an allowed value');
        }
    }

    not_eat_value(n_eaten) {
        if (n_eaten === 0) {
            return -1 * this.cash_to_points_conversion;
        }
        else if (n_eaten === 1) {
            return -1 * (6 / 4);
        }
        else if (n_eaten === 2) {
            return ((2 * 6) / 4);
        }
        else if (n_eaten === 3) {
            return ((3 * 6) / 4);
        }
        else if (n_eaten === 4) {
            return 6;
        }
        else {
            throw new Error('n_eaten does not have an allowed value');
        }
    }
}

function add_polynomials(poly_a, poly_b) {
    if (poly_a.coef_array.length !== poly_b.coef_array.length) {
        throw new Error('Inconsistent coefficient array lengths');
    }
    const new_coefs = [];
    const new_outcomes = [];
    for (let i = 0;i < poly_a.coef_array.length;i++) {
        new_outcomes.push([]);
        for (let j = 0;j < poly_a.outcome_array[i].length;j++) {
            if (poly_a.outcome_array[i][j] !== poly_b.outcome_array[i][j]) {
                throw new Error('Polynomials have inconsistent outcome arrays')
            }
            new_outcomes[i].push(poly_a.outcome_array[i][j]);
        }
        new_coefs.push(poly_a.coef_array[i] + poly_b.coef_array[i]);
    }
    return new OutcomePolynomial(new_outcomes, new_coefs);
}

function equal_value_eqn(n_probs, value_fn_a, value_fn_b) {

    function _sign_reversed_b(x) {
        return -1 * value_fn_b(x);
    }

    return add_polynomials(
        create_value_polynomial(n_probs, value_fn_a),
        create_value_polynomial(n_probs, _sign_reversed_b),
    );
}

