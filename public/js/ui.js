/**
 * Gestion de l'interface utilisateur pour le solveur de programmation linéaire
 */

// Initialisation des solveurs
const simplexSolver = new SimplexSolver();
const dualSolver = new DualSolver();

// Variables globales
let variableCount = 1; // Nombre de variables dans la fonction objectif
let constraintCount = 1; // Nombre de contraintes
let currentProblem = null; // Problème actuel
let currentSolution = null; // Solution actuelle
let dualProblem = null; // Problème dual

// Éléments DOM fréquemment utilisés
const objectiveFunctionContainer = document.getElementById('objective-function-container');
const constraintsContainer = document.getElementById('constraints-container');
const methodSelection = document.getElementById('method-selection');
const resultsSection = document.getElementById('results-section');
const solutionSummary = document.getElementById('solution-summary');
const iterationsContainer = document.getElementById('iterations-container');
const visualizationContainer = document.getElementById('visualization-container');

/**
 * Initialise l'interface utilisateur
 */
function initUI() {
    // Boutons d'ajout
    document.getElementById('add-objective-var').addEventListener('click', addObjectiveVariable);
    document.getElementById('add-constraint').addEventListener('click', addConstraint);
    document.getElementById('remove-all-constraints').addEventListener('click', removeAllConstraints);
    
    // Boutons d'action
    document.getElementById('solve-button').addEventListener('click', solveProblem);
    document.getElementById('reset-button').addEventListener('click', resetForm);
    document.getElementById('convert-dual-button').addEventListener('click', convertToDual);
    document.getElementById('reset-dual-button').addEventListener('click', resetForm);
    document.getElementById('back-to-primal-button').addEventListener('click', backToPrimal);
    
    // Onglets de navigation
    document.getElementById('simplex-tab').addEventListener('click', showSimplexForm);
    
    // Écouteurs pour les changements de type de contrainte
    document.querySelectorAll('.constraint-type').forEach(select => {
        select.addEventListener('change', checkMethodSelection);
    });
    
    // L'option Minimiser a été retirée, donc nous n'avons plus besoin de ces écouteurs
    
    // Initialiser les écouteurs pour le premier bouton d'ajout de variable de contrainte
    document.querySelector('.add-constraint-var').addEventListener('click', function() {
        addConstraintVariable(this.closest('.constraint-row'));
    });
    
    // Initialiser les écouteurs pour le premier bouton de suppression de contrainte
    document.querySelector('.remove-constraint').addEventListener('click', function() {
        removeConstraint(this.closest('.constraint-row'));
    });
}

/**
 * Ajoute une variable à la fonction objectif
 */
function addObjectiveVariable() {
    variableCount++;
    
    // Créer les éléments pour la nouvelle variable
    const container = document.createElement('div');
    container.className = 'variable-group d-inline-flex align-items-center me-3 mb-2';
    
    const sign = document.createElement('span');
    sign.className = 'me-2';
    sign.textContent = '+';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-control coefficient-input me-2';
    input.placeholder = 'Coefficient';
    input.step = 'any';
    
    const varLabel = document.createElement('span');
    varLabel.className = 'me-2';
    varLabel.innerHTML = `X<sub>${variableCount}</sub>`;
    
    // Bouton de suppression
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-sm btn-danger';
    removeButton.innerHTML = '<i class="bi bi-trash"></i>';
    removeButton.addEventListener('click', function() {
        removeObjectiveVariable(container, variableCount);
    });
    
    // Assembler les éléments
    container.appendChild(sign);
    container.appendChild(input);
    container.appendChild(varLabel);
    container.appendChild(removeButton);
    
    // Insérer avant le bouton d'ajout
    const addButton = document.getElementById('add-objective-var');
    objectiveFunctionContainer.insertBefore(container, addButton);
}

/**
 * Ajoute une variable à une contrainte
 * @param {HTMLElement} constraintRow - Ligne de contrainte à laquelle ajouter la variable
 */
function addConstraintVariable(constraintRow) {
    // Trouver l'index de la contrainte
    const constraintIndex = Array.from(constraintsContainer.children).indexOf(constraintRow);
    
    // Compter le nombre de variables déjà présentes dans cette contrainte
    const varCount = constraintRow.querySelectorAll('.coefficient-input').length;
    
    // Créer les éléments pour la nouvelle variable
    const container = document.createElement('div');
    container.className = 'variable-group d-inline-flex align-items-center me-2';
    
    const sign = document.createElement('span');
    sign.className = 'me-2';
    sign.textContent = '+';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-control coefficient-input me-2';
    input.placeholder = 'Coefficient';
    input.step = 'any';
    
    const varLabel = document.createElement('span');
    varLabel.className = 'me-2';
    varLabel.innerHTML = `X<sub>${varCount + 1}</sub>`;
    
    // Bouton de suppression
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-sm btn-danger';
    removeButton.innerHTML = '<i class="bi bi-trash"></i>';
    removeButton.addEventListener('click', function() {
        removeConstraintVariable(container, constraintRow);
    });
    
    // Assembler les éléments
    container.appendChild(sign);
    container.appendChild(input);
    container.appendChild(varLabel);
    container.appendChild(removeButton);
    
    // Insérer avant le bouton d'ajout
    const flexContainer = constraintRow.querySelector('.d-flex');
    const addButton = constraintRow.querySelector('.add-constraint-var');
    flexContainer.insertBefore(container, addButton);
    
    // Si le nombre de variables dans cette contrainte dépasse le nombre total de variables,
    // ajouter une variable à la fonction objectif
    if (varCount + 1 > variableCount) {
        addObjectiveVariable();
    }
}

/**
 * Ajoute une nouvelle contrainte
 */
function addConstraint() {
    constraintCount++;
    
    // Créer les éléments pour la nouvelle contrainte
    const constraintRow = document.createElement('div');
    constraintRow.className = 'constraint-row mb-3';
    
    const flexContainer = document.createElement('div');
    flexContainer.className = 'd-flex align-items-center flex-wrap mb-2';
    
    // Première variable
    const variableGroup = document.createElement('div');
    variableGroup.className = 'variable-group d-inline-flex align-items-center me-2';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-control coefficient-input me-2';
    input.placeholder = 'Coefficient';
    input.step = 'any';
    
    const varLabel = document.createElement('span');
    varLabel.className = 'me-2';
    varLabel.innerHTML = `X<sub>1</sub>`;
    
    variableGroup.appendChild(input);
    variableGroup.appendChild(varLabel);
    
    // Bouton d'ajout de variable
    const addVarButton = document.createElement('button');
    addVarButton.type = 'button';
    addVarButton.className = 'btn btn-sm btn-success me-2 add-constraint-var';
    addVarButton.innerHTML = '<i class="bi bi-plus-lg"></i>';
    addVarButton.addEventListener('click', function() {
        addConstraintVariable(constraintRow);
    });
    
    // Sélecteur de type de contrainte
    const constraintType = document.createElement('select');
    constraintType.className = 'form-select constraint-type me-2';
    constraintType.innerHTML = `
        <option value="<=">≤</option>
        <option value="=">=</option>
    `;
    constraintType.addEventListener('change', checkMethodSelection);
    
    // Valeur du côté droit
    const rhsInput = document.createElement('input');
    rhsInput.type = 'number';
    rhsInput.className = 'form-control rhs-input';
    rhsInput.placeholder = 'Valeur';
    rhsInput.step = 'any';
    
    // Bouton de suppression de contrainte
    const removeConstraintButton = document.createElement('button');
    removeConstraintButton.type = 'button';
    removeConstraintButton.className = 'btn btn-sm btn-danger ms-2 remove-constraint';
    removeConstraintButton.innerHTML = '<i class="bi bi-trash"></i>';
    removeConstraintButton.addEventListener('click', function() {
        removeConstraint(constraintRow);
    });
    
    // Assembler les éléments
    flexContainer.appendChild(variableGroup);
    flexContainer.appendChild(addVarButton);
    flexContainer.appendChild(constraintType);
    flexContainer.appendChild(rhsInput);
    flexContainer.appendChild(removeConstraintButton);
    
    constraintRow.appendChild(flexContainer);
    
    // Ajouter la nouvelle contrainte au conteneur
    constraintsContainer.appendChild(constraintRow);
}

/**
 * Vérifie si une méthode spéciale (Grand M ou Deux Phases) est nécessaire
 */
function checkMethodSelection() {
    let needsSpecialMethod = false;
    
    // Parcourir tous les types de contraintes
    document.querySelectorAll('.constraint-type').forEach(select => {
        // La méthode spéciale est nécessaire uniquement pour les contraintes '='
        if (select.value === '=') {
            needsSpecialMethod = true;
        }
    });
    
    // Afficher ou masquer la sélection de méthode
    methodSelection.style.display = needsSpecialMethod ? 'block' : 'none';
}

// La fonction updateConstraintTypes a été supprimée car l'option Minimiser a été retirée

/**
 * Collecte les données du formulaire pour créer un problème de programmation linéaire
 * @returns {Object} - Problème de programmation linéaire
 */
function collectFormData() {
    // Type d'objectif (toujours maximiser)
    const objectiveType = 'maximize';
    
    // Coefficients de la fonction objectif
    const objectiveInputs = objectiveFunctionContainer.querySelectorAll('.coefficient-input');
    const objectiveCoefficients = Array.from(objectiveInputs).map(input => {
        const value = parseFloat(input.value);
        return isNaN(value) ? 0 : value;
    });
    
    // Contraintes
    const constraints = [];
    const constraintRows = constraintsContainer.querySelectorAll('.constraint-row');
    
    constraintRows.forEach(row => {
        const coefficientInputs = row.querySelectorAll('.coefficient-input');
        const coefficients = Array.from(coefficientInputs).map(input => {
            const value = parseFloat(input.value);
            return isNaN(value) ? 0 : value;
        });
        
        // Compléter avec des zéros si nécessaire
        while (coefficients.length < objectiveCoefficients.length) {
            coefficients.push(0);
        }
        
        const type = row.querySelector('.constraint-type').value;
        const rhs = parseFloat(row.querySelector('.rhs-input').value) || 0;
        
        constraints.push({
            coefficients,
            type,
            rhs
        });
    });
    
    // Méthode de résolution
    let solutionMethod = 'standard';
    if (methodSelection.style.display !== 'none') {
        solutionMethod = 'grand-m';
    }
    
    return {
        objectiveCoefficients,
        constraints,
        objectiveType,
        solutionMethod
    };
}

/**
 * Réinitialise le formulaire
 */
function resetForm() {
    // Réinitialiser les compteurs
    variableCount = 1;
    constraintCount = 1;
    
    // Réinitialiser la fonction objectif
    objectiveFunctionContainer.innerHTML = `
        <input type="number" class="form-control coefficient-input me-2" placeholder="Coefficient" step="any">
        <span class="me-2">X<sub>1</sub></span>
        <button type="button" class="btn btn-sm btn-success me-3" id="add-objective-var">
            <i class="bi bi-plus-lg"></i>
        </button>
    `;
    
    // Réattacher l'écouteur d'événement
    document.getElementById('add-objective-var').addEventListener('click', addObjectiveVariable);
    
    // Réinitialiser les contraintes
    constraintsContainer.innerHTML = `
        <div class="constraint-row mb-3">
            <div class="d-flex align-items-center flex-wrap mb-2">
                <input type="number" class="form-control coefficient-input me-2" placeholder="Coefficient" step="any">
                <span class="me-2">X<sub>1</sub></span>
                <button type="button" class="btn btn-sm btn-success me-2 add-constraint-var">
                    <i class="bi bi-plus-lg"></i>
                </button>
                <select class="form-select constraint-type me-2">
                    <option value="<=">≤</option>
                    <option value="=">=</option>
                </select>
                <input type="number" class="form-control rhs-input" placeholder="Valeur" step="any">
            </div>
        </div>
    `;
    
    // Réattacher les écouteurs d'événements
    document.querySelector('.add-constraint-var').addEventListener('click', function() {
        addConstraintVariable(this.closest('.constraint-row'));
    });
    
    document.querySelector('.constraint-type').addEventListener('change', checkMethodSelection);
    
    // Réinitialiser la sélection de méthode
    methodSelection.style.display = 'none';
    document.getElementById('grand-m').checked = true;
    
    // Masquer les résultats
    resultsSection.style.display = 'none';
    
    // Réinitialiser les problèmes et solutions
    currentProblem = null;
    currentSolution = null;
    dualProblem = null;
    
    // Afficher le formulaire du simplex
    showSimplexForm();
}

/**
 * Affiche le formulaire du simplex
 */
function showSimplexForm() {
    document.getElementById('simplex-form').style.display = 'block';
    document.getElementById('dual-form').style.display = 'none';
    document.getElementById('method-title').textContent = 'Méthode du Simplex Tabulaire';
    document.getElementById('simplex-tab').classList.add('active');
    document.getElementById('dual-tab').classList.remove('active');
}

/**
 * Affiche le formulaire de la dualité
 */
function showDualForm() {
    document.getElementById('simplex-form').style.display = 'none';
    document.getElementById('dual-form').style.display = 'block';
    document.getElementById('method-title').textContent = 'Méthode de la Dualité';
    document.getElementById('simplex-tab').classList.remove('active');
    document.getElementById('dual-tab').classList.add('active');
}

/**
 * Supprime une variable de la fonction objectif
 * @param {HTMLElement} variableElement - Élément de variable à supprimer
 * @param {Number} varIndex - Index de la variable à supprimer
 */
function removeObjectiveVariable(variableElement, varIndex) {
    // Vérifier qu'il reste au moins une variable dans la fonction objectif
    const variables = objectiveFunctionContainer.querySelectorAll('.variable-group');
    if (variables.length <= 1) {
        showError('Vous devez conserver au moins une variable dans la fonction objectif.');
        return;
    }
    
    // Supprimer la variable
    variableElement.remove();
    
    // Mettre à jour les indices des variables suivantes
    updateVariableIndices();
}

/**
 * Supprime une variable d'une contrainte
 * @param {HTMLElement} variableElement - Élément de variable à supprimer
 * @param {HTMLElement} constraintRow - Ligne de contrainte contenant la variable
 */
function removeConstraintVariable(variableElement, constraintRow) {
    // Vérifier qu'il reste au moins une variable dans la contrainte
    const variables = constraintRow.querySelectorAll('.variable-group');
    if (variables.length <= 1) {
        showError('Vous devez conserver au moins une variable dans chaque contrainte.');
        return;
    }
    
    // Supprimer la variable
    variableElement.remove();
    
    // Mettre à jour les indices des variables dans cette contrainte
    updateConstraintVariableIndices(constraintRow);
}

/**
 * Supprime une contrainte
 * @param {HTMLElement} constraintRow - Ligne de contrainte à supprimer
 */
function removeConstraint(constraintRow) {
    // Vérifier qu'il reste au moins une contrainte
    if (constraintsContainer.children.length <= 1) {
        showError('Vous devez conserver au moins une contrainte.');
        return;
    }
    
    // Supprimer la contrainte
    constraintRow.remove();
    constraintCount--;
}

/**
 * Supprime toutes les contraintes sauf la première
 */
function removeAllConstraints() {
    // Garder la première contrainte et supprimer les autres
    while (constraintsContainer.children.length > 1) {
        constraintsContainer.removeChild(constraintsContainer.lastChild);
    }
    constraintCount = 1;
}

/**
 * Met à jour les indices des variables dans la fonction objectif
 */
function updateVariableIndices() {
    const variables = objectiveFunctionContainer.querySelectorAll('.variable-group');
    variables.forEach((variable, index) => {
        const varLabel = variable.querySelector('span:nth-of-type(2)');
        varLabel.innerHTML = `X<sub>${index + 1}</sub>`;
    });
    
    // Mettre à jour le compteur de variables
    variableCount = variables.length;
    
    // Mettre à jour les indices des variables dans toutes les contraintes
    const constraintRows = constraintsContainer.querySelectorAll('.constraint-row');
    constraintRows.forEach(row => {
        updateConstraintVariableIndices(row);
    });
}

/**
 * Met à jour les indices des variables dans une contrainte
 * @param {HTMLElement} constraintRow - Ligne de contrainte à mettre à jour
 */
function updateConstraintVariableIndices(constraintRow) {
    const variables = constraintRow.querySelectorAll('.variable-group');
    variables.forEach((variable, index) => {
        const varLabel = variable.querySelector('span:nth-of-type(2)');
        varLabel.innerHTML = `X<sub>${index + 1}</sub>`;
    });
}

// Initialiser l'interface utilisateur au chargement de la page
document.addEventListener('DOMContentLoaded', initUI);
