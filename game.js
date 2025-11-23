import {find_all_potential_solns, check_soln_validity} from "./equilibrium_calc.js"

const CHARACTERS = ['Ania Magliano', 'Maisie Adam', 'Phil Ellis', 'Reece Shearsmith', 'Sanjeev Bhaskar'];

const SCREENS = {CHARACTER_SELECT: 0, VALUE_SELECT: 1, DUCK_CHOICE: 2, RESULTS: 3};

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

function draw_value_screen(box) {
    box.innerHTML = "";
    const text = create_text("Your selected character is " + player_character);
    box.appendChild(text);
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