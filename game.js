import {find_all_potential_solns, check_soln_validity} from "./equilibrium_calc.js"

const CHARACTERS = ['Ania Magliano', 'Maisie Adam', 'Phil Ellis', 'Reece Shearsmith', 'Sanjeev Bhaskar'];

const SCREENS = {CHARACTER_SELECT: 0, VALUE_SELECT: 1, DUCK_CHOICE: 2, RESULTS: 3};

const VALUE_MAX = 10;
const VALUE_DEFAULT = 0;

let screen = SCREENS.CHARACTER_SELECT;
let player_character = null;

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
    input_container.appendChild(value_input);
    const current_selection = document.createElement("span");
    current_selection.textContent = VALUE_DEFAULT.toString();
    input_container.appendChild(current_selection);
    value_input.oninput = () => {current_selection.textContent = value_input.value};
    return input_container;
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
}

function draw() {
    const box = document.getElementById("gamebox");
    if (screen === SCREENS.CHARACTER_SELECT) {
        draw_intro_screen(box);
    }
    else if (screen === SCREENS.VALUE_SELECT) {
        draw_value_screen(box);
    }
}

draw();