import {find_all_potential_solns, check_soln_validity} from "./equilibrium_calc.js"

const CHARACTERS = ['Ania Magliano', 'Maisie Adam', 'Phil Ellis', 'Reece Shearsmith', 'Sanjeev Bhaskar'];

function draw_intro_screen(box) {
    box.innerHTML = "";
    const text = document.createElement('div');
    text.setAttribute("class", "gametext");
    text.textContent = "Choose your character:";
    box.appendChild(text);
    for (const character of CHARACTERS) {
        const char_select = document.createElement('button');
        char_select.setAttribute("class", "character_button");
        char_select.textContent = character;
        box.appendChild(char_select);
    }
}

function draw() {
    const box = document.getElementById("gamebox");
    draw_intro_screen(box);
}

draw();