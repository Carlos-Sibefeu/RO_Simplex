/**
 * Fonctions pour la visualisation et l'affichage du problème dual
 */

/**
 * Affiche le problème dual
 * @param {Object} primalProblem - Problème primal
 * @param {Object} dualProblem - Problème dual
 */
function displayDualProblem(primalProblem, dualProblem) {
    // Créer une représentation textuelle du problème dual
    const dualProblemText = dualSolver.formatDualProblem(dualProblem);
    
    // Créer le contenu HTML
    let html = `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Problème Primal</h5>
                    </div>
                    <div class="card-body">
                        <pre class="math-container">${formatPrimalProblem(primalProblem)}</pre>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Problème Dual</h5>
                    </div>
                    <div class="card-body">
                        <pre class="math-container">${dualProblemText}</pre>
                    </div>
                </div>
            </div>
        </div>
        <div class="alert alert-info">
            <h5>Conversion en Dual</h5>
            <p>La conversion en dual permet de transformer un problème de programmation linéaire en son dual.</p>
            <p>Les variables duales (Y) correspondent aux contraintes du problème primal, et les contraintes duales correspondent aux variables du problème primal.</p>
        </div>
    `;
    
    // Mettre à jour le contenu du formulaire dual
    const dualForm = document.getElementById('dual-form');
    
    // Insérer le contenu avant les boutons
    const buttons = dualForm.querySelector('.d-grid');
    dualForm.innerHTML = '';
    dualForm.appendChild(createElementFromHTML(html));
    dualForm.appendChild(buttons);
}

/**
 * Formate le problème primal pour l'affichage
 * @param {Object} problem - Problème primal
 * @returns {String} - Représentation textuelle du problème primal
 */
function formatPrimalProblem(problem) {
    const { objectiveCoefficients, constraints, objectiveType } = problem;
    
    // Fonction objectif
    let formattedProblem = `${objectiveType === 'maximize' ? 'Maximiser' : 'Minimiser'} Z = `;
    
    for (let i = 0; i < objectiveCoefficients.length; i++) {
        const coeff = objectiveCoefficients[i];
        if (i > 0) {
            formattedProblem += coeff >= 0 ? ' + ' : ' - ';
            formattedProblem += `${Math.abs(coeff)}X${i + 1}`;
        } else {
            formattedProblem += `${coeff}X${i + 1}`;
        }
    }
    
    formattedProblem += '\n\nSous contraintes :\n';
    
    // Contraintes
    for (let i = 0; i < constraints.length; i++) {
        const { coefficients, type, rhs } = constraints[i];
        
        for (let j = 0; j < coefficients.length; j++) {
            const coeff = coefficients[j];
            if (j > 0) {
                formattedProblem += coeff >= 0 ? ' + ' : ' - ';
                formattedProblem += `${Math.abs(coeff)}X${j + 1}`;
            } else {
                formattedProblem += `${coeff}X${j + 1}`;
            }
        }
        
        switch (type) {
            case '<=':
                formattedProblem += ' ≤ ';
                break;
            case '=':
                formattedProblem += ' = ';
                break;
            case '>=':
                formattedProblem += ' ≥ ';
                break;
        }
        
        formattedProblem += `${rhs}\n`;
    }
    
    // Contraintes de non-négativité
    formattedProblem += '\nAvec ';
    for (let i = 0; i < objectiveCoefficients.length; i++) {
        if (i > 0) {
            formattedProblem += ', ';
        }
        formattedProblem += `X${i + 1} ≥ 0`;
    }
    
    return formattedProblem;
}

/**
 * Crée un élément HTML à partir d'une chaîne HTML
 * @param {String} html - Chaîne HTML
 * @returns {HTMLElement} - Élément HTML créé
 */
function createElementFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
}

/**
 * Affiche une visualisation graphique du problème (pour les problèmes à 2 variables)
 * @param {Object} problem - Problème à visualiser
 * @param {Object} solution - Solution du problème
 */
function displayVisualization(problem, solution) {
    // Vérifier que le problème a exactement 2 variables
    if (problem.objectiveCoefficients.length !== 2) {
        visualizationContainer.innerHTML = '<div class="alert alert-warning">La visualisation n\'est disponible que pour les problèmes à 2 variables.</div>';
        return;
    }
    
    // Extraire les contraintes
    const constraints = problem.constraints;
    
    // Définir les limites du graphique
    let xMax = 10;
    let yMax = 10;
    
    // Ajuster les limites en fonction des contraintes
    for (const constraint of constraints) {
        const [a, b] = constraint.coefficients;
        const c = constraint.rhs;
        
        if (a !== 0 && b === 0) {
            // Contrainte de la forme ax <= c
            const xIntercept = c / a;
            xMax = Math.max(xMax, xIntercept * 1.5);
        } else if (a === 0 && b !== 0) {
            // Contrainte de la forme by <= c
            const yIntercept = c / b;
            yMax = Math.max(yMax, yIntercept * 1.5);
        } else if (a !== 0 && b !== 0) {
            // Contrainte de la forme ax + by <= c
            const xIntercept = c / a;
            const yIntercept = c / b;
            xMax = Math.max(xMax, xIntercept * 1.5);
            yMax = Math.max(yMax, yIntercept * 1.5);
        }
    }
    
    // Arrondir à l'entier supérieur
    xMax = Math.ceil(xMax);
    yMax = Math.ceil(yMax);
    
    // Créer les données pour les contraintes
    const traces = [];
    
    // Ajouter les axes
    traces.push({
        x: [0, 0],
        y: [0, yMax],
        mode: 'lines',
        line: {
            color: 'black',
            width: 2
        },
        showlegend: false
    });
    
    traces.push({
        x: [0, xMax],
        y: [0, 0],
        mode: 'lines',
        line: {
            color: 'black',
            width: 2
        },
        showlegend: false
    });
    
    // Ajouter les contraintes
    for (let i = 0; i < constraints.length; i++) {
        const [a, b] = constraints[i].coefficients;
        const c = constraints[i].rhs;
        const type = constraints[i].type;
        
        // Points pour tracer la ligne de la contrainte
        let x = [];
        let y = [];
        
        if (a === 0 && b === 0) {
            continue; // Ignorer les contraintes triviales
        } else if (a === 0) {
            // Ligne horizontale
            x = [0, xMax];
            y = [c / b, c / b];
        } else if (b === 0) {
            // Ligne verticale
            x = [c / a, c / a];
            y = [0, yMax];
        } else {
            // Ligne oblique
            x = [0, c / a];
            y = [c / b, 0];
        }
        
        traces.push({
            x,
            y,
            mode: 'lines',
            line: {
                color: 'rgba(255, 0, 0, 0.7)',
                width: 2
            },
            name: `Contrainte ${i + 1}: ${a}x₁ + ${b}x₂ ${type} ${c}`
        });
    }
    
    // Ajouter la région réalisable (pour les problèmes de maximisation)
    if (problem.objectiveType === 'maximize') {
        // Générer une grille de points
        const gridSize = 50;
        const xStep = xMax / gridSize;
        const yStep = yMax / gridSize;
        
        const feasibleX = [];
        const feasibleY = [];
        
        for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
                const x = i * xStep;
                const y = j * yStep;
                
                // Vérifier si le point satisfait toutes les contraintes
                let isFeasible = true;
                
                for (const constraint of constraints) {
                    const [a, b] = constraint.coefficients;
                    const c = constraint.rhs;
                    const type = constraint.type;
                    
                    const lhs = a * x + b * y;
                    
                    if ((type === '<=' && lhs > c) ||
                        (type === '=' && lhs !== c) ||
                        (type === '>=' && lhs < c)) {
                        isFeasible = false;
                        break;
                    }
                }
                
                if (isFeasible) {
                    feasibleX.push(x);
                    feasibleY.push(y);
                }
            }
        }
        
        traces.push({
            x: feasibleX,
            y: feasibleY,
            mode: 'markers',
            marker: {
                color: 'rgba(0, 0, 255, 0.2)',
                size: 5
            },
            name: 'Région réalisable'
        });
    }
    
    // Ajouter la solution optimale
    if (solution.feasible && !solution.unbounded && solution.solution) {
        traces.push({
            x: [solution.solution[0]],
            y: [solution.solution[1]],
            mode: 'markers',
            marker: {
                color: 'green',
                size: 10,
                symbol: 'star'
            },
            name: `Solution optimale: (${solution.solution[0] !== undefined ? solution.solution[0].toFixed(2) : 'N/A'}, ${solution.solution[1] !== undefined ? solution.solution[1].toFixed(2) : 'N/A'})`
        });
    }
    
    // Ajouter la fonction objectif
    const [c1, c2] = problem.objectiveCoefficients;
    
    if (solution.feasible && !solution.unbounded && solution.objectiveValue !== undefined) {
        // Tracer la ligne de niveau de la fonction objectif passant par la solution optimale
        const z = solution.objectiveValue;
        
        // Points pour tracer la ligne de niveau
        let x = [];
        let y = [];
        
        if (c1 === 0 && c2 === 0) {
            // Fonction objectif triviale
        } else if (c1 === 0) {
            // Ligne horizontale
            x = [0, xMax];
            y = [z / c2, z / c2];
        } else if (c2 === 0) {
            // Ligne verticale
            x = [z / c1, z / c1];
            y = [0, yMax];
        } else {
            // Ligne oblique
            x = [0, z / c1];
            y = [z / c2, 0];
        }
        
        traces.push({
            x,
            y,
            mode: 'lines',
            line: {
                color: 'rgba(0, 128, 0, 0.7)',
                width: 2,
                dash: 'dash'
            },
            name: `Fonction objectif: ${c1}x₁ + ${c2}x₂ = ${z.toFixed(2)}`
        });
    }
    
    // Configuration du graphique
    const layout = {
        title: 'Visualisation graphique du problème',
        xaxis: {
            title: 'X₁',
            range: [0, xMax]
        },
        yaxis: {
            title: 'X₂',
            range: [0, yMax]
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            orientation: 'h', // horizontal
            x: 0.5,           // centré horizontalement
            y: -0.2,          // sous le graphique
            xanchor: 'center',
            yanchor: 'top'
        }
    };
    
    // Créer le graphique
    Plotly.newPlot(visualizationContainer, traces, layout);
}
