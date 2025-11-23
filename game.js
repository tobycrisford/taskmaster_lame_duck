import {find_all_potential_solns, check_soln_validity, find_a_solution_with_minimal_fixed} from "./equilibrium_calc.js"

const CHARACTERS = ['Ania Magliano', 'Maisie Adam', 'Phil Ellis', 'Reece Shearsmith', 'Sanjeev Bhaskar'];
const CHAR_INDEX_MAP = {};
for (let i = 0;i < CHARACTERS.length;i++) {
    CHAR_INDEX_MAP[CHARACTERS[i]] = i;
}

const SCREENS = {CHARACTER_SELECT: 0, VALUE_SELECT: 1, DUCK_CHOICE: 2, RESULTS: 3};

const VALUE_MAX = 10;
const VALUE_DEFAULT = 0;

// Game state
let screen = SCREENS.CHARACTER_SELECT;
let player_character = null;
const character_values = {};
let strategies = null;
let last_move = null;
const last_points = Array(CHARACTERS.length).fill(0);
const last_cash = Array(CHARACTERS.length).fill(0);
const total_points = Array(CHARACTERS.length).fill(0);
const total_cash = Array(CHARACTERS.length).fill(0);

function reset_counters() {
    for (const arr of [total_points, total_cash]) {
        for (let i = 0;i < arr.length;i++) {
            arr[i] = 0;
        }
    }
}

function select_character(character) {
    player_character = character;
    screen = SCREENS.VALUE_SELECT;
    draw();
}

function create_text(text_content) {
    const text = document.createElement('div');
    text.setAttribute("class", "gametext");
    text.textContent = text_content;
    return text;
}

function draw_intro_screen(box) {
    box.innerHTML = "";
    const text = create_text("Choose your character:");
    box.appendChild(text);
    for (const character of CHARACTERS) {
        const char_select = document.createElement('button');
        char_select.setAttribute("class", "character_button");
        char_select.textContent = character;
        char_select.addEventListener("click", () => {select_character(character)});
        box.appendChild(char_select);
    }
}

function create_value_input(character, description) {
    const input_container = document.createElement("div");
    input_container.setAttribute("class", "value_input_container");
    input_container.textContent = description;
    const value_input = document.createElement("input");
    value_input.setAttribute("type", "range");
    value_input.setAttribute("min", "0");
    value_input.setAttribute("max", VALUE_MAX.toString());
    value_input.setAttribute("value", VALUE_DEFAULT.toString());
    value_input.setAttribute("class", "value_slider");
    value_input.setAttribute("id", character + "_value_input");
    input_container.appendChild(value_input);
    const current_selection = document.createElement("span");
    current_selection.textContent = VALUE_DEFAULT.toString();
    input_container.appendChild(current_selection);
    value_input.oninput = () => {current_selection.textContent = value_input.value};
    return input_container;
}

function select_values() {
    for (const character of CHARACTERS) {
        character_values[character] = document.getElementById(character + "_value_input").value;
    }
    strategies = calculate_strategy();
    screen = SCREENS.DUCK_CHOICE;
    draw();
}

function draw_value_screen(box) {
    box.innerHTML = "";
    let text = [];
    text.push("Your selected character is " + player_character);
    text.push("How many points would each character be willing to give up in exchange for £25?");
    text.push("Include your own tradeoff.");
    text.push("Each player's points/cash tradeoff is common knowledge for all players.");
    for (const line of text) {
        const textbox = create_text(line);
        box.appendChild(textbox);
    }
    let val_input = create_value_input(player_character, player_character + ' (You)');
    box.appendChild(val_input);
    for (const character of CHARACTERS) {
        if (character === player_character) {
            continue;
        }
        val_input = create_value_input(character, character);
        box.appendChild(val_input);
    }
    const submit = document.createElement("button");
    submit.textContent = "Play game";
    submit.addEventListener("click", select_values);
    box.appendChild(submit);
}

function calculate_strategy() {
    const values = [];
    const idxs = [];
    for (let i = 0;i < CHARACTERS.length;i++) {
        values.push(parseInt(character_values[CHARACTERS[i]]));
        idxs.push(i);
    }
    const all_eat = find_all_potential_solns(values, [], idxs);
    if (all_eat.length !== 1) {
        // If we force everyone to eat, there is trivially only one potential solution
        throw new Error('Something has gone wrong with potential solution finder');
    }
    if (check_soln_validity(all_eat[0], [], idxs)) {
        return all_eat[0][0];
    }

    const solns = find_a_solution_with_minimal_fixed(values);
    console.log(solns);
    if (solns.length !== 1) {
        throw new Error('Not implemented this possibility yet');
    }
    return solns[0][0];
}

function sample_prob(prob) {
    if (Math.random() < prob) {
        return true;
    }
    else {
        return false;
    }
}

function play_round(player_decision) {
    const player_moves = [];
    for (let i = 0;i < CHARACTERS.length;i++) {
        const character = CHARACTERS[i];
        if (character === player_character) {
            player_moves.push(player_decision);
        }
        else {
            player_moves.push(sample_prob(strategies[i]));
        }
    }

    last_move = player_moves;

    let total_eats = 0;
    for (const move of player_moves) {
        if (move) {
            total_eats += 1;
        }
    }

    if (total_eats === 0) {
        for (let i = 0;i < last_cash.length;i++) {
            last_points[i] = 0;
            last_cash[i] = -25;
        }
    }
    else if (total_eats === 1) {
        for (let i = 0;i < last_points.length;i++) {
            if (last_move[i]) {
                last_points[i] = 5;
                last_cash[i] = 0;
            }
            else {
                last_points[i] = -1;
                last_cash[i] = 0;
            }
        }
    }
    else if (total_eats > 1 && total_eats < 5) {
        for (let i = 0;i < last_points.length;i++) {
            if (last_move[i]) {
                last_points[i] = -3;
                last_cash[i] = 0;
            }
            else {
                last_points[i] = 3;
                last_cash[i] = 0;
            }
        }
    }
    else if (total_eats === 5) {
        for (let i = 0;i < last_points.length;i++) {
            last_points[i] = -3;
            last_cash[i] = 25;
        }
    }
    else {
        throw new Error('Points logic is broken');
    }

    for (let i = 0;i < total_points.length;i++) {
        total_points[i] += last_points[i];
        total_cash[i] += last_cash[i];
    }

    console.log(last_move);
    console.log(last_points);
    console.log(last_cash);
    console.log(total_points);
    console.log(total_cash);

    screen = SCREENS.RESULTS;
    draw();
}

function draw_duck_choice_screen(box) {
    box.innerHTML = "";
    console.log(character_values);
    console.log(strategies);

    const text_box = create_text("Make your choice now");
    
    const eat_button = document.createElement("button");
    eat_button.textContent = "Eat the Lamé Duck"
    eat_button.addEventListener("click", () => {play_round(true)});
    const not_eat_button = document.createElement("button");
    not_eat_button.textContent = "Don't eat the Lamé Duck";
    not_eat_button.addEventListener("click", () => {play_round(false)});

    box.appendChild(text_box);
    box.appendChild(eat_button);
    box.appendChild(not_eat_button);
}

function add_table_element(table, cell_type, content) {
    const new_cell = document.createElement(cell_type);
    new_cell.textContent = content;
    table.appendChild(new_cell);
}

function create_character_row(character, name) {
    const char_idx = CHAR_INDEX_MAP[character];

    const table_row = document.createElement("tr");
    add_table_element(table_row, "td", name);
    if (last_move[char_idx]) {
        add_table_element(table_row, "td", "Eats");
    }
    else {
        add_table_element(table_row, "td", "Doesn't eat");
    }
    add_table_element(table_row, "td", last_points[char_idx].toString());
    add_table_element(table_row, "td", last_cash[char_idx].toString());
    add_table_element(table_row, "td", total_points[char_idx].toString());
    add_table_element(table_row, "td", total_cash[char_idx].toString());

    return table_row;
}

function play_again() {
    screen = SCREENS.DUCK_CHOICE;
    draw();
}

function reset() {
    reset_counters();
    screen = SCREENS.CHARACTER_SELECT;
    draw();
}

function draw_results_screen(box) {
    box.innerHTML = "";

    const table = document.createElement("table");
    const header_row = document.createElement("tr");
    add_table_element(header_row, "th", "Player");
    add_table_element(header_row, "th", "Move selected");
    add_table_element(header_row, "th", "Points received");
    add_table_element(header_row, "th", "Cash received");
    add_table_element(header_row, "th", "Total points so far");
    add_table_element(header_row, "th", "Total cash so far");
    table.appendChild(header_row);

    const top_row = create_character_row(player_character, player_character + " (You)");
    table.appendChild(top_row);
    for (const character of CHARACTERS) {
        if (character === player_character) {
            continue;
        }
        const row = create_character_row(character, character);
        table.appendChild(row);
    }

    box.appendChild(table);

    const button_row = document.createElement("div");
    button_row.setAttribute("class", "button-row");

    const play_again_button = document.createElement("button");
    play_again_button.textContent = "Play another round";
    play_again_button.addEventListener("click", play_again);
    button_row.appendChild(play_again_button);

    const reset_button = document.createElement("button");
    reset_button.textContent = "Reset";
    reset_button.addEventListener("click", reset);
    button_row.appendChild(reset_button);

    box.appendChild(button_row);
}

function draw() {
    const box = document.getElementById("gamebox");
    if (screen === SCREENS.CHARACTER_SELECT) {
        draw_intro_screen(box);
    }
    else if (screen === SCREENS.VALUE_SELECT) {
        draw_value_screen(box);
    }
    else if (screen === SCREENS.DUCK_CHOICE) {
        draw_duck_choice_screen(box);
    }
    else if (screen === SCREENS.RESULTS) {
        draw_results_screen(box);
    }
    else {
        throw new Error('Unrecongized screen option');
    }
}

draw();