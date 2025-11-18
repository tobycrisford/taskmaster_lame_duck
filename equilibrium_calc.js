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