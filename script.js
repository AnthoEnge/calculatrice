
let allButton = [...document.querySelectorAll('button')];
let buttonKeyCode = allButton.map(touche => touche.dataset.key);
let ecranText = document.querySelector(".ecran").firstChild;

window.addEventListener("keydown", function(e) {
    const valeur = e.keyCode.toString();
    calculer(valeur);
    console.log(valeur, typeof(valeur))
})

document.addEventListener("click", (e) => {
    const valeur = e.target.dataset.key;
    calculer(valeur);
})

const calculer = (valeur) => {
    if ( buttonKeyCode.includes(valeur)) {
        switch(valeur) {
            case "8":
                ecranText.textContent = "";
                break
            case "13":
                const calcul = eval(ecranText.textContent);
                ecranText.textContent = calcul;
                break
            default :
                const indexKeycode = buttonKeyCode.indexOf(valeur);
                const touche = allButton[indexKeycode];
                ecranText.textContent += touche.innerHTML;
                break
        }
    }
}

window.addEventListener('error', () => {
    alert("Oups une erreur de syntaxe c'est produite.");
})
