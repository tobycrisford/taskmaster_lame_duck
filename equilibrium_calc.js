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
    constructor(coef_array) {
        this.coef_array = coef_array;
    }

    _poly_eval(probs, outcomes, coef_array) {
        if (outcomes.length !== coef_array.length) {
            throw new Error('Outcome and coefficient array lengths are inconsistent');
        }
        let result = 0.0;
        for (let j = 0;j < coef_array.length;j++) {
            if (outcomes[j].length !== probs.length) {
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


}