// My attempt at translating equilibrium_calc.py to javascript, with limited javascript knowledge!

import { lusolve } from 'mathjs';

const TOLERANCE = 10**(-6);

function* generate_all_outcomes(n_players) {

    function* _generate_all_outcomes(current, current_outcome) {
        if (current > n_players) {
            throw new Error('n_players must be a positive integer')
        }
        if (current === n_players) {
            yield [...current_outcome];
        } else {
            current_outcome.push(true);
            yield* _generate_all_outcomes(current + 1, current_outcome);
            current_outcome.pop();
            current_outcome.push(false);
            yield* _generate_all_outcomes(current + 1, current_outcome);
            current_outcome.pop();
        }
    }

    yield* _generate_all_outcomes(0, []);
}

class OutcomePolynomial {
    constructor(outcome_array, coef_array) {
        if (outcome_array.length !== coef_array.length) {
            throw new Error('Outcome array and coefficient array have inconsistent shapes')
        }
        this.coef_array = coef_array;
        this.outcome_array = outcome_array;
    }

    _poly_eval(probs, mask, coef_array) {
        if (this.outcome_array.length !== coef_array.length) {
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
            if (this.outcome_array[j].length !== probs.length) {
                throw new Error('Bad outcome length');
            }
            let prob = 1.0;
            for (let i = 0;i < probs.length;i++) {
                if (this.outcome_array[j][i]) {
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
        const mask = Array(probs.length).fill(true);
        for (let i = 0;i < probs.length;i++) {
            mask[i] = false;
            let deriv_coefs = [...this.coef_array];
            for (let j = 0;j < this.outcome_array.length;j++) {
                if (!this.outcome_array[j][i]) {
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

    eat_value = (n_eaten) => {
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

    not_eat_value = (n_eaten) => {
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

function newton_rhapson_prep(lhs, all_probs) {
    // Given an eqn of form lhs=0, with ith eqn having ith prob ommitted, return the derivative matrix
    // and rhs vector for NR linear solve step.

    const vec_elements = [];
    const deriv_rows = [];
    for (let i = 0;i < lhs.length;i++) {
        const lhs_row = lhs[i];
        const relevant_probs = all_probs.slice(0, i).concat(all_probs.slice(i+1,all_probs.length))
        vec_elements.push(-1 * lhs_row.eval(relevant_probs));
        const deriv_row = lhs_row.deriv(relevant_probs);
        deriv_rows.push(deriv_row.slice(0, i).concat([0.0]).concat(deriv_row.slice(i, all_probs.length)));
    }

    return [deriv_rows, vec_elements];
}

function create_equations_from_values(cash_to_points_conversions) {
    // Return equations to be solved, along with value equations for each player.

    const eqns = [];
    const eat_values = [];
    const not_eat_values = [];
    for (const conversion of cash_to_points_conversions) {
        const player = new PlayerValue(conversion);
        const eqn = equal_value_eqn(cash_to_points_conversions.length - 1, player.eat_value, player.not_eat_value);
        const eat_value = create_value_polynomial(cash_to_points_conversions.length - 1, player.eat_value);
        const not_eat_value = create_value_polynomial(cash_to_points_conversions.length - 1, player.not_eat_value);
        
        eqns.push(eqn);
        eat_values.push(eat_value);
        not_eat_values.push(not_eat_value);
    }
    
    return [eqns, eat_values, not_eat_values];
}

function apply_mask(arr, mask) {
    // Apply mask to all dimensions of array

    const out_arr = [];
    for (let i = 0;i < arr.length;i++) {
        if (mask[i]) {
            let val = null;   
            if (Array.isArray(arr[i])) {
                val = apply_mask(arr[i], mask);
            }
            else {
                val = arr[i];
            }
            out_arr.push(val);
        }
    }
    return out_arr;
}

function solve(cash_to_points_conversions, starting_probs, exclude_indices) {
    // Find probabilities that solve equilibrium equations, along with value of game for each player

    const ITERATION_LIMIT = 1000;
    
    const mask = Array(starting_probs.length).fill(true);
    for (const idx of exclude_indices) {
        mask[idx] = false;
    }

    const eqns_and_vals = create_equations_from_values(cash_to_points_conversions);
    const eqns = eqns_and_vals[0];
    const eat_vals = eqns_and_vals[1];
    const not_eat_vals = eqns_and_vals[2];

    const soln = [...starting_probs];

    let soln_found = false;
    for (let i = 0;i < ITERATION_LIMIT;i++) {
        const nr_prep = newton_rhapson_prep(eqns, soln);
        const deriv_masked = apply_mask(nr_prep[0], mask);
        const rhs_masked = apply_mask(nr_prep[1], mask);

        let below_tolerance = true;
        for (const val of rhs_masked) {
            if (Math.abs(val) > TOLERANCE) {
                below_tolerance = false;
                break;
            }
        }
        if (below_tolerance) {
            soln_found = true;
            break;
        }

        const update = lusolve(deriv_masked, rhs_masked);
        let mask_counter = 0;
        for (let j = 0;j < soln.length;j++) {
            if (mask[j]) {
                soln[j] += update[mask_counter];
                mask_counter++;
            }
        }
    }

    if (!soln_found) {
        throw new Error('Solution did not converge');
    }

    const eat_vals_eval = newton_rhapson_prep(eat_vals, soln);
    const not_eat_vals_eval = newton_rhapson_prep(not_eat_vals, soln);

    return [soln, -1 * eat_vals_eval[1], -1 * not_eat_vals_eval[1]];
}

function find_all_potential_solns(cash_to_points_conversions, fixed_zeros, fixed_ones) {
    const N_TRIALS = 100;
    
    for (const zero of fixed_zeros) {
        if (fixed_ones.includes(zero)) {
            throw new Error('Overlap between zeros and ones');
        }
    }

    const exclude_indices = fixed_ones.concat(fixed_zeros);

    const solns = [];
    for (let i = 0;i < N_TRIALS;i++) {
        const initialization_vec = [];
        for (let j = 0;j < cash_to_points_conversions.length;j++) {
            initialization_vec.push(Math.random());
        }
        for (const idx of fixed_zeros) {
            initialization_vec[idx] = 0.0;
        }
        for (const idx of fixed_ones) {
            initialization_vec[idx] = 1.0;
        }
        const soln_data = solve(cash_to_points_conversions, initialization_vec, exclude_indices);
        let keep = true;
        for (const prob of soln_data[0]) {
            if ((prob > 1.0 + TOLERANCE) || (prob < 0.0 - TOLERANCE)) {
                keep = false;
                break;
            }
        }
        if (!keep) {
            continue;
        }
        for (const existing_soln of solns) {
            let match = true;
            for (let j = 0;j < existing_soln[0].length;j++) {
                if (Math.abs(existing_soln[0][j] - soln_data[0][j]) > TOLERANCE) {
                    match = false;
                    break;
                }
            }
            if (match) {
                keep = false;
                break;
            }
        }
        if (keep) {
            solns.push(soln_data);
        }
    }

    return solns;
}

function check_soln_validity(soln_data, fixed_zeros, fixed_ones) {
    const soln = soln_data[0];
    const eat_value = soln_data[1];
    const not_eat_value = soln_data[2];

    let valid = true;
    for (const idx of fixed_zeros) {
        if (eat_value[idx] > not_eat_value[idx] + TOLERANCE) {
            valid = false;
            break;
        }
    }
    if (!valid) {
        return false;
    }
    for (const idx of fixed_ones) {
        if (not_eat_value[idx] > eat_value[idx] + TOLERANCE) {
            valid = false;
            break;
        }
    }
    return valid;
}

const output_div = document.getElementById('output');

const test_solns = find_all_potential_solns([0,0,0,0,0], [], []);
output_div.innerText = test_solns.toString();
console.log(test_solns);