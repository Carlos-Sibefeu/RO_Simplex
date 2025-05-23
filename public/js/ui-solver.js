/**
 * Fonctions pour résoudre les problèmes et afficher les résultats
 */

/**
 * Résout le problème avec la méthode du simplex
 */
function solveProblem() {
    // Collecter les données du formulaire
    currentProblem = collectFormData();
    
    // Vérifier que les données sont valides
    if (!validateProblem(currentProblem)) {
        return;
    }
    
    try {
        // Résoudre le problème
        currentSolution = simplexSolver.solve(
            currentProblem.objectiveCoefficients,
            currentProblem.constraints,
            currentProblem.objectiveType,
            currentProblem.solutionMethod
        );
        
        // Afficher les résultats
        displayResults(currentProblem, currentSolution);
        
        // Afficher la section des résultats
        resultsSection.style.display = 'block';
        
        // Faire défiler jusqu'aux résultats
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError('Une erreur est survenue lors de la résolution du problème: ' + error.message);
    }
}

/**
 * Résout le problème avec la méthode de la dualité
 */
function solveDualProblem() {
    if (!currentProblem || !dualProblem) {
        showError('Veuillez d\'abord convertir un problème primal en dual.');
        return;
    }
    
    try {
        // Résoudre le problème avec la méthode de la dualité
        const dualSolution = dualSolver.solve(
            currentProblem.objectiveCoefficients,
            currentProblem.constraints,
            currentProblem.objectiveType
        );
        
        // Afficher les résultats
        displayDualResults(currentProblem, dualProblem, dualSolution);
        
        // Afficher la section des résultats
        resultsSection.style.display = 'block';
        
        // Faire défiler jusqu'aux résultats
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError('Une erreur est survenue lors de la résolution du problème dual: ' + error.message);
    }
}

/**
 * Convertit le problème primal en dual
 */
function convertToDual() {
    // Collecter les données du formulaire
    currentProblem = collectFormData();
    
    // Vérifier que les données sont valides
    if (!validateProblem(currentProblem)) {
        return;
    }
    
    try {
        // Convertir le problème primal en dual
        dualProblem = dualSolver.convertToDual(
            currentProblem.objectiveCoefficients,
            currentProblem.constraints,
            currentProblem.objectiveType
        );
        
        // Afficher le problème dual
        displayDualProblem(currentProblem, dualProblem);
        
        // Passer à l'onglet dual
        showDualForm();
    } catch (error) {
        showError('Une erreur est survenue lors de la conversion en dual: ' + error.message);
    }
}

/**
 * Revient au problème primal
 */
function backToPrimal() {
    showSimplexForm();
}

/**
 * Valide les données du problème
 * @param {Object} problem - Problème à valider
 * @returns {Boolean} - True si le problème est valide, false sinon
 */
function validateProblem(problem) {
    // Vérifier que les coefficients de la fonction objectif sont valides
    if (problem.objectiveCoefficients.length === 0 || problem.objectiveCoefficients.every(c => c === 0)) {
        showError('Veuillez entrer au moins un coefficient non nul dans la fonction objectif.');
        return false;
    }
    
    // Vérifier que les contraintes sont valides
    if (problem.constraints.length === 0) {
        showError('Veuillez ajouter au moins une contrainte.');
        return false;
    }
    
    // Vérifier que chaque contrainte a au moins un coefficient non nul
    for (let i = 0; i < problem.constraints.length; i++) {
        const constraint = problem.constraints[i];
        if (constraint.coefficients.every(c => c === 0)) {
            showError(`La contrainte ${i + 1} doit avoir au moins un coefficient non nul.`);
            return false;
        }
    }
    
    return true;
}

/**
 * Affiche un message d'erreur
 * @param {String} message - Message d'erreur à afficher
 */
function showError(message) {
    // Créer une alerte Bootstrap
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insérer l'alerte au début du formulaire
    const form = document.getElementById('simplex-form').style.display === 'block'
        ? document.getElementById('simplex-form')
        : document.getElementById('dual-form');
    
    form.insertBefore(alert, form.firstChild);
    
    // Faire disparaître l'alerte après 5 secondes
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

/**
 * Affiche les résultats de la résolution
 * @param {Object} problem - Problème résolu
 * @param {Object} solution - Solution du problème
 */
function displayResults(problem, solution) {
    // Afficher le résumé de la solution
    displaySolutionSummary(problem, solution);
    
    // Afficher les itérations
    displayIterations(solution.iterations);
    
    // Afficher la visualisation (uniquement pour les problèmes à 2 variables)
    if (problem.objectiveCoefficients.length === 2) {
        displayVisualization(problem, solution);
    } else {
        document.getElementById('visualization-tab').style.display = 'none';
    }
    
    // Activer l'onglet de résumé
    document.getElementById('summary-tab').click();
}

/**
 * Affiche les résultats de la résolution avec la méthode de la dualité
 * @param {Object} primalProblem - Problème primal
 * @param {Object} dualProblem - Problème dual
 * @param {Object} dualSolution - Solution du problème dual
 */
function displayDualResults(primalProblem, dualProblem, dualSolution) {
    // Afficher le résumé de la solution
    displayDualSolutionSummary(primalProblem, dualProblem, dualSolution);
    
    // Afficher les itérations
    displayIterations(dualSolution.dualSolution.iterations);
    
    // Afficher la visualisation (uniquement pour les problèmes à 2 variables)
    if (primalProblem.objectiveCoefficients.length === 2) {
        displayVisualization(primalProblem, dualSolution.primalSolution);
    } else {
        document.getElementById('visualization-tab').style.display = 'none';
    }
    
    // Activer l'onglet de résumé
    document.getElementById('summary-tab').click();
}

/**
 * Affiche le résumé de la solution
 * @param {Object} problem - Problème résolu
 * @param {Object} solution - Solution du problème
 */
function displaySolutionSummary(problem, solution) {
    let html = '';
    
    if (!solution.feasible) {
        html += `<div class="alert alert-warning">Le problème n'a pas de solution réalisable.</div>`;
    } else if (solution.unbounded) {
        html += `<div class="alert alert-info">Le problème est non borné. La valeur de la fonction objectif peut être arbitrairement ${problem.objectiveType === 'maximize' ? 'grande' : 'petite'}.</div>`;
    } else {
        // Valeur de la fonction objectif
        html += `<h4>Valeur optimale de la fonction objectif</h4>`;
        html += `<div class="math-container mb-4">`;
        html += `Z* = ${solution.objectiveValue.toFixed(4)}`;
        html += `</div>`;
        
        // Valeurs des variables de décision
        html += `<h4>Valeurs des variables de décision</h4>`;
        html += `<div class="table-responsive mb-4">`;
        html += `<table class="table table-striped">`;
        html += `<thead><tr><th>Variable</th><th>Valeur</th></tr></thead>`;
        html += `<tbody>`;
        
        for (let i = 0; i < solution.solution.length; i++) {
            html += `<tr>`;
            html += `<td>X<sub>${i + 1}</sub></td>`;
            html += `<td>${solution.solution[i].toFixed(4)}</td>`;
            html += `</tr>`;
        }
        
        html += `</tbody></table></div>`;
        
        // Interprétation économique (si applicable)
        html += `<h4>Interprétation</h4>`;
        html += `<p>La solution optimale est atteinte avec les valeurs ci-dessus, donnant une valeur de fonction objectif de ${solution.objectiveValue.toFixed(4)}.</p>`;
        
        // Méthode utilisée
        html += `<div class="alert alert-info mt-3">`;
        html += `<strong>Méthode utilisée:</strong> `;
        
        switch (problem.solutionMethod) {
            case 'standard':
                html += `Méthode du Simplex standard`;
                break;
            case 'grand-m':
                html += `Méthode du Grand M`;
                break;
            case 'two-phase':
                html += `Méthode des Deux Phases`;
                break;
        }
        
        html += `</div>`;
    }
    
    // Mettre à jour le contenu
    solutionSummary.innerHTML = html;
}

/**
 * Affiche le résumé de la solution avec la méthode de la dualité
 * @param {Object} primalProblem - Problème primal
 * @param {Object} dualProblem - Problème dual
 * @param {Object} dualSolution - Solution du problème dual
 */
function displayDualSolutionSummary(primalProblem, dualProblem, dualSolution) {
    let html = '';
    
    const { primalSolution, dualProblem: dualProblemSolution } = dualSolution;
    
    if (!primalSolution.feasible) {
        html += `<div class="alert alert-warning">Le problème n'a pas de solution réalisable.</div>`;
    } else if (primalSolution.unbounded) {
        html += `<div class="alert alert-info">Le problème est non borné. La valeur de la fonction objectif peut être arbitrairement ${primalProblem.objectiveType === 'maximize' ? 'grande' : 'petite'}.</div>`;
    } else {
        // Valeur de la fonction objectif
        html += `<h4>Valeur optimale de la fonction objectif (Primal)</h4>`;
        html += `<div class="math-container mb-4">`;
        html += `Z* = ${primalSolution.objectiveValue.toFixed(4)}`;
        html += `</div>`;
        
        // Valeurs des variables de décision primales
        html += `<h4>Valeurs des variables de décision (Primal)</h4>`;
        html += `<div class="table-responsive mb-4">`;
        html += `<table class="table table-striped">`;
        html += `<thead><tr><th>Variable</th><th>Valeur</th></tr></thead>`;
        html += `<tbody>`;
        
        for (let i = 0; i < primalSolution.solution.length; i++) {
            html += `<tr>`;
            html += `<td>X<sub>${i + 1}</sub></td>`;
            html += `<td>${primalSolution.solution[i].toFixed(4)}</td>`;
            html += `</tr>`;
        }
        
        html += `</tbody></table></div>`;
        
        // Valeurs des variables de décision duales
        html += `<h4>Valeurs des variables de décision (Dual)</h4>`;
        html += `<div class="table-responsive mb-4">`;
        html += `<table class="table table-striped">`;
        html += `<thead><tr><th>Variable</th><th>Valeur</th></tr></thead>`;
        html += `<tbody>`;
        
        const dualSolutionValues = dualSolution.dualSolution.solution;
        
        for (let i = 0; i < dualSolutionValues.length; i++) {
            html += `<tr>`;
            html += `<td>Y<sub>${i + 1}</sub></td>`;
            html += `<td>${dualSolutionValues[i].toFixed(4)}</td>`;
            html += `</tr>`;
        }
        
        html += `</tbody></table></div>`;
        
        // Interprétation économique
        html += `<h4>Interprétation</h4>`;
        html += `<p>La solution optimale du problème primal est atteinte avec les valeurs ci-dessus, donnant une valeur de fonction objectif de ${primalSolution.objectiveValue.toFixed(4)}.</p>`;
        html += `<p>Les variables duales (Y) représentent les prix marginaux des ressources, indiquant combien la fonction objectif changerait si la contrainte correspondante était relâchée d'une unité.</p>`;
        
        // Théorème de la dualité
        html += `<div class="alert alert-info mt-3">`;
        html += `<strong>Théorème de la dualité:</strong> La valeur optimale de la fonction objectif du primal est égale à la valeur optimale de la fonction objectif du dual.`;
        html += `</div>`;
    }
    
    // Mettre à jour le contenu
    solutionSummary.innerHTML = html;
}

/**
 * Affiche les itérations de la résolution
 * @param {Array} iterations - Itérations de la résolution
 */
function displayIterations(iterations) {
    let html = '';
    
    if (iterations.length === 0) {
        html += `<div class="alert alert-warning">Aucune itération disponible.</div>`;
    } else {
        for (let i = 0; i < iterations.length; i++) {
            const iteration = iterations[i];
            
            html += `<div class="iteration-card">`;
            html += `<div class="iteration-header">`;
            
            if (i === 0) {
                html += `Tableau initial`;
                if (iteration.phase !== null) {
                    html += ` (Phase ${iteration.phase})`;
                }
            } else {
                html += `Itération ${i}`;
                if (iteration.phase !== null) {
                    html += ` (Phase ${iteration.phase})`;
                }
                
                // Informations sur le pivot
                html += `<div class="mt-2">`;
                html += `<span class="badge bg-primary me-2">Variable entrante: ${iteration.enteringVar}</span>`;
                html += `<span class="badge bg-danger me-2">Variable sortante: ${iteration.leavingVar}</span>`;
                html += `<span class="badge bg-info">Élément pivot: ${iteration.pivotElement !== null ? iteration.pivotElement.toFixed(4) : 'N/A'}</span>`;
                html += `</div>`;
            }
            
            html += `</div>`; // Fin de iteration-header
            
            // Tableau
            html += `<div class="table-responsive">`;
            html += `<table class="table table-bordered">`;
            
            // En-tête du tableau
            html += `<thead><tr>`;
            html += `<th>Base</th>`;
            
            const tableau = iteration.tableau;
            for (let j = 0; j < tableau[0].length - 1; j++) {
                // Déterminer le nom de la variable
                let varName = '';
                if (iteration.basicVars && j < iteration.basicVars.length + 1) {
                    for (const basicVar of iteration.basicVars) {
                        if (basicVar.index === j) {
                            varName = basicVar.name;
                            break;
                        }
                    }
                }
                
                if (!varName) {
                    // Si ce n'est pas une variable de base, déterminer le type
                    if (j < currentProblem.objectiveCoefficients.length) {
                        varName = `X<sub>${j + 1}</sub>`;
                    } else {
                        // Variable d'écart, de surplus ou artificielle
                        const slackVarCount = iteration.basicVars ? iteration.basicVars.filter(v => v.type === 'slack').length : 0;
                        const surplusVarCount = iteration.basicVars ? iteration.basicVars.filter(v => v.type === 'surplus').length : 0;
                        
                        if (j < currentProblem.objectiveCoefficients.length + slackVarCount) {
                            varName = `S<sub>${j - currentProblem.objectiveCoefficients.length + 1}</sub>`;
                        } else if (j < currentProblem.objectiveCoefficients.length + slackVarCount + surplusVarCount) {
                            varName = `E<sub>${j - currentProblem.objectiveCoefficients.length - slackVarCount + 1}</sub>`;
                        } else {
                            varName = `A<sub>${j - currentProblem.objectiveCoefficients.length - slackVarCount - surplusVarCount + 1}</sub>`;
                        }
                    }
                }
                
                // Mettre en évidence la colonne pivot
                const isEnteringVar = iteration.pivotCol === j;
                html += `<th class="${isEnteringVar ? 'entering-var' : ''}">${varName}</th>`;
            }
            
            html += `<th>RHS</th>`;
            html += `</tr></thead>`;
            
            // Corps du tableau
            html += `<tbody>`;
            
            // Ligne Z
            html += `<tr>`;
            html += `<td>Z</td>`;
            
            for (let j = 0; j < tableau[0].length; j++) {
                html += `<td>${tableau[0][j].toFixed(4)}</td>`;
            }
            
            html += `</tr>`;
            
            // Lignes des contraintes
            for (let j = 1; j < tableau.length; j++) {
                html += `<tr>`;
                
                // Variable de base
                if (iteration.basicVars && j - 1 < iteration.basicVars.length) {
                    html += `<td class="${iteration.pivotRow === j ? 'leaving-var' : ''}">${iteration.basicVars[j - 1].name}</td>`;
                } else {
                    html += `<td>-</td>`;
                }
                
                // Coefficients
                for (let k = 0; k < tableau[j].length; k++) {
                    const isPivot = iteration.pivotRow === j && iteration.pivotCol === k;
                    html += `<td class="${isPivot ? 'pivot-cell' : ''} ${iteration.pivotRow === j ? 'leaving-var' : ''} ${iteration.pivotCol === k ? 'entering-var' : ''}">${tableau[j][k].toFixed(4)}</td>`;
                }
                
                html += `</tr>`;
            }
            
            html += `</tbody></table></div>`;
            
            // Solution de base réalisable
            if (i > 0) {
                html += `<div class="p-3">`;
                html += `<h6>Solution de base réalisable:</h6>`;
                html += `<div class="math-container">`;
                
                // Variables de base
                let solutionText = '';
                for (let j = 0; j < iteration.basicVars.length; j++) {
                    const basicVar = iteration.basicVars[j];
                    const value = tableau[j + 1][tableau[j + 1].length - 1];
                    
                    if (j > 0) {
                        solutionText += ', ';
                    }
                    
                    solutionText += `${basicVar.name} = ${value.toFixed(4)}`;
                }
                
                // Variables non basiques
                for (let j = 0; j < tableau[0].length - 1; j++) {
                    let isBasic = false;
                    for (const basicVar of iteration.basicVars) {
                        if (basicVar.index === j) {
                            isBasic = true;
                            break;
                        }
                    }
                    
                    if (!isBasic) {
                        if (solutionText) {
                            solutionText += ', ';
                        }
                        
                        // Déterminer le nom de la variable
                        let varName = '';
                        if (j < currentProblem.objectiveCoefficients.length) {
                            varName = `X<sub>${j + 1}</sub>`;
                        } else {
                            // Variable d'écart, de surplus ou artificielle
                            const slackVarCount = iteration.basicVars.filter(v => v.type === 'slack').length;
                            const surplusVarCount = iteration.basicVars.filter(v => v.type === 'surplus').length;
                            
                            if (j < currentProblem.objectiveCoefficients.length + slackVarCount) {
                                varName = `S<sub>${j - currentProblem.objectiveCoefficients.length + 1}</sub>`;
                            } else if (j < currentProblem.objectiveCoefficients.length + slackVarCount + surplusVarCount) {
                                varName = `E<sub>${j - currentProblem.objectiveCoefficients.length - slackVarCount + 1}</sub>`;
                            } else {
                                varName = `A<sub>${j - currentProblem.objectiveCoefficients.length - slackVarCount - surplusVarCount + 1}</sub>`;
                            }
                        }
                        
                        solutionText += `${varName} = 0`;
                    }
                }
                
                html += solutionText;
                html += `</div></div>`;
            }
            
            html += `</div>`; // Fin de iteration-card
            
            // Ajouter un séparateur entre les itérations
            if (i < iterations.length - 1) {
                html += `<div class="text-center mb-4"><i class="bi bi-arrow-down-circle-fill text-primary fs-3"></i></div>`;
            }
        }
    }
    
    // Mettre à jour le contenu
    iterationsContainer.innerHTML = html;
}
