/**
 * Classe pour résoudre des problèmes de programmation linéaire avec la méthode du simplex
 */
class SimplexSolver {
    constructor() {
        this.iterations = [];
        this.objectiveType = 'maximize';
        this.solutionMethod = 'standard';
        this.M = 1000; // Valeur pour la méthode du Grand M
    }

    /**
     * Prépare le tableau initial du simplex
     * @param {Array} objectiveCoefficients - Coefficients de la fonction objectif
     * @param {Array} constraints - Tableau des contraintes
     * @param {String} objectiveType - Type d'objectif ('maximize' ou 'minimize')
     * @param {String} solutionMethod - Méthode de résolution ('standard', 'grand-m', 'two-phase')
     * @returns {Object} - Tableau initial et informations sur le problème
     */
    setupTableau(objectiveCoefficients, constraints, objectiveType = 'maximize', solutionMethod = 'standard') {
        this.objectiveType = objectiveType;
        this.solutionMethod = solutionMethod;
        this.iterations = [];
        
        // Nombre de variables de décision
        const numVars = objectiveCoefficients.length;
        
        // Déterminer le nombre de contraintes et de variables d'écart/artificielles nécessaires
        let numSlackVars = 0;
        let numSurplusVars = 0;
        let numArtificialVars = 0;
        
        constraints.forEach(constraint => {
            if (constraint.type === '<=') {
                numSlackVars++;
            } else if (constraint.type === '>=') {
                numSurplusVars++;
                numArtificialVars++;
            } else if (constraint.type === '=') {
                numArtificialVars++;
            }
        });
        
        // Tableau pour stocker les informations sur les variables de base
        const basicVars = [];
        
        // Créer le tableau initial
        let tableau = [];
        
        // Ajuster les coefficients de la fonction objectif selon le type d'objectif
        let objCoeffs = [...objectiveCoefficients];
        if (objectiveType === 'minimize') {
            objCoeffs = objCoeffs.map(coeff => -coeff);
        }
        
        // Ligne de la fonction objectif (Z)
        let zRow = Array(numVars + numSlackVars + numSurplusVars + numArtificialVars + 1).fill(0);
        
        // Remplir les coefficients de la fonction objectif
        for (let i = 0; i < numVars; i++) {
            zRow[i] = -objCoeffs[i]; // Négatif car on déplace tout d'un côté
        }
        
        // Si nous utilisons la méthode du Grand M, nous devons ajouter les termes M pour les variables artificielles
        if (solutionMethod === 'grand-m' && numArtificialVars > 0) {
            let artificialVarIndex = numVars + numSlackVars + numSurplusVars;
            
            for (let i = 0; i < numArtificialVars; i++) {
                zRow[artificialVarIndex + i] = this.M; // Coefficient M pour les variables artificielles
            }
        }
        
        // Ajouter la ligne Z au tableau
        tableau.push(zRow);
        
        // Ajouter les contraintes au tableau
        let slackVarIndex = numVars;
        let surplusVarIndex = numVars + numSlackVars;
        let artificialVarIndex = numVars + numSlackVars + numSurplusVars;
        
        constraints.forEach((constraint, constraintIndex) => {
            let row = Array(numVars + numSlackVars + numSurplusVars + numArtificialVars + 1).fill(0);
            
            // Coefficients des variables de décision
            for (let i = 0; i < numVars; i++) {
                row[i] = constraint.coefficients[i] || 0;
            }
            
            // Valeur du côté droit (RHS)
            row[row.length - 1] = constraint.rhs;
            
            // Ajouter les variables d'écart, de surplus ou artificielles selon le type de contrainte
            if (constraint.type === '<=') {
                row[slackVarIndex] = 1; // Variable d'écart
                basicVars.push({
                    index: slackVarIndex,
                    name: `S<sub>${slackVarIndex - numVars + 1}</sub>`,
                    type: 'slack'
                });
                slackVarIndex++;
            } else if (constraint.type === '>=') {
                row[surplusVarIndex] = -1; // Variable de surplus
                row[artificialVarIndex] = 1; // Variable artificielle
                
                // Si nous utilisons la méthode du Grand M, nous devons ajuster la ligne Z
                if (solutionMethod === 'grand-m') {
                    // Soustraire M fois la ligne de contrainte de la ligne Z
                    for (let i = 0; i < row.length; i++) {
                        zRow[i] -= this.M * row[i];
                    }
                }
                
                basicVars.push({
                    index: artificialVarIndex,
                    name: `a${constraintIndex + 1}`,
                    type: 'artificial'
                });
                
                surplusVarIndex++;
                artificialVarIndex++;
            } else if (constraint.type === '=') {
                row[artificialVarIndex] = 1; // Variable artificielle
                
                // Si nous utilisons la méthode du Grand M, nous devons ajuster la ligne Z
                if (solutionMethod === 'grand-m') {
                    // Soustraire M fois la ligne de contrainte de la ligne Z
                    for (let i = 0; i < row.length; i++) {
                        zRow[i] -= this.M * row[i];
                    }
                }
                
                basicVars.push({
                    index: artificialVarIndex,
                    name: `a${constraintIndex + 1}`,
                    type: 'artificial'
                });
                
                artificialVarIndex++;
            }
            
            tableau.push(row);
        });
        
        // Stocker la première itération
        this.iterations.push({
            tableau: JSON.parse(JSON.stringify(tableau)),
            basicVars: JSON.parse(JSON.stringify(basicVars)),
            enteringVar: null,
            leavingVar: null,
            pivotRow: null,
            pivotCol: null,
            pivotElement: null,
            phase: solutionMethod === 'two-phase' ? 1 : null
        });
        
        return {
            tableau,
            basicVars,
            numVars,
            numSlackVars,
            numSurplusVars,
            numArtificialVars
        };
    }

    /**
     * Trouve la variable entrante (colonne pivot)
     * @param {Array} tableau - Tableau du simplex actuel
     * @returns {Number} - Index de la colonne pivot ou -1 si optimal
     */
    findEnteringVariable(tableau) {
        const zRow = tableau[0];
        let minValue = 0;
        let enteringVarIndex = -1;
        
        // Parcourir tous les coefficients de la ligne Z (sauf le dernier qui est la valeur de Z)
        for (let i = 0; i < zRow.length - 1; i++) {
            if (zRow[i] < minValue) {
                minValue = zRow[i];
                enteringVarIndex = i;
            }
        }
        
        return enteringVarIndex;
    }

    /**
     * Trouve la variable sortante (ligne pivot)
     * @param {Array} tableau - Tableau du simplex actuel
     * @param {Number} pivotCol - Index de la colonne pivot
     * @returns {Number} - Index de la ligne pivot ou -1 si non borné
     */
    findLeavingVariable(tableau, pivotCol) {
        let minRatio = Infinity;
        let leavingVarIndex = -1;
        
        // Parcourir toutes les lignes de contraintes
        for (let i = 1; i < tableau.length; i++) {
            const row = tableau[i];
            
            // Si le coefficient de la colonne pivot est positif
            if (row[pivotCol] > 0) {
                const ratio = row[row.length - 1] / row[pivotCol];
                
                // Mettre à jour le ratio minimum
                if (ratio < minRatio) {
                    minRatio = ratio;
                    leavingVarIndex = i;
                }
            }
        }
        
        return leavingVarIndex;
    }

    /**
     * Effectue une itération du simplex
     * @param {Array} tableau - Tableau du simplex actuel
     * @param {Array} basicVars - Variables de base actuelles
     * @returns {Object} - Nouveau tableau, variables de base et informations sur l'itération
     */
    iterate(tableau, basicVars) {
        // Trouver la variable entrante (colonne pivot)
        const pivotCol = this.findEnteringVariable(tableau);
        
        // Si aucune variable entrante n'est trouvée, la solution est optimale
        if (pivotCol === -1) {
            return {
                tableau,
                basicVars,
                optimal: true,
                unbounded: false,
                pivotRow: null,
                pivotCol: null,
                pivotElement: null,
                enteringVar: null,
                leavingVar: null
            };
        }
        
        // Trouver la variable sortante (ligne pivot)
        const pivotRow = this.findLeavingVariable(tableau, pivotCol);
        
        // Si aucune variable sortante n'est trouvée, le problème est non borné
        if (pivotRow === -1) {
            return {
                tableau,
                basicVars,
                optimal: false,
                unbounded: true,
                pivotRow: null,
                pivotCol: pivotCol,
                pivotElement: null,
                enteringVar: this.getVariableName(pivotCol, basicVars),
                leavingVar: null
            };
        }
        
        // Élément pivot
        const pivotElement = tableau[pivotRow][pivotCol];
        
        // Mettre à jour les variables de base
        const enteringVar = this.getVariableName(pivotCol, basicVars);
        const leavingVar = basicVars[pivotRow - 1];
        basicVars[pivotRow - 1] = {
            index: pivotCol,
            name: enteringVar,
            type: this.getVariableType(pivotCol, basicVars)
        };
        
        // Créer un nouveau tableau pour l'itération suivante
        let newTableau = JSON.parse(JSON.stringify(tableau));
        
        // Normaliser la ligne pivot
        for (let j = 0; j < newTableau[pivotRow].length; j++) {
            newTableau[pivotRow][j] /= pivotElement;
        }
        
        // Éliminer la variable entrante des autres lignes
        for (let i = 0; i < newTableau.length; i++) {
            if (i !== pivotRow) {
                const factor = newTableau[i][pivotCol];
                for (let j = 0; j < newTableau[i].length; j++) {
                    newTableau[i][j] -= factor * newTableau[pivotRow][j];
                }
            }
        }
        
        return {
            tableau: newTableau,
            basicVars,
            optimal: false,
            unbounded: false,
            pivotRow,
            pivotCol,
            pivotElement,
            enteringVar,
            leavingVar: leavingVar.name
        };
    }

    /**
     * Obtient le nom d'une variable à partir de son index
     * @param {Number} index - Index de la variable
     * @param {Array} basicVars - Variables de base actuelles
     * @returns {String} - Nom de la variable
     */
    getVariableName(index, basicVars) {
        // Vérifier si c'est une variable de base
        for (const basicVar of basicVars) {
            if (basicVar.index === index) {
                return basicVar.name;
            }
        }
        
        // Sinon, déterminer le type de variable en fonction de son index
        const { numVars, numSlackVars, numSurplusVars } = this.getProblemDimensions(basicVars);
        
        if (index < numVars) {
            return `x${index + 1}`;
        } else if (index < numVars + numSlackVars) {
            return `s${index - numVars + 1}`;
        } else if (index < numVars + numSlackVars + numSurplusVars) {
            return `e${index - numVars - numSlackVars + 1}`;
        } else {
            return `a${index - numVars - numSlackVars - numSurplusVars + 1}`;
        }
    }

    /**
     * Obtient le type d'une variable à partir de son index
     * @param {Number} index - Index de la variable
     * @param {Array} basicVars - Variables de base actuelles
     * @returns {String} - Type de la variable
     */
    getVariableType(index, basicVars) {
        const { numVars, numSlackVars, numSurplusVars } = this.getProblemDimensions(basicVars);
        
        if (index < numVars) {
            return 'decision';
        } else if (index < numVars + numSlackVars) {
            return 'slack';
        } else if (index < numVars + numSlackVars + numSurplusVars) {
            return 'surplus';
        } else {
            return 'artificial';
        }
    }

    /**
     * Obtient les dimensions du problème à partir des variables de base
     * @param {Array} basicVars - Variables de base actuelles
     * @returns {Object} - Dimensions du problème
     */
    getProblemDimensions(basicVars) {
        let numVars = 0;
        let numSlackVars = 0;
        let numSurplusVars = 0;
        let numArtificialVars = 0;
        
        // Parcourir toutes les variables de base pour trouver les indices maximaux
        for (const basicVar of basicVars) {
            const index = basicVar.index;
            const type = basicVar.type;
            
            if (type === 'decision' && index >= numVars) {
                numVars = index + 1;
            } else if (type === 'slack' && index >= numVars + numSlackVars) {
                numSlackVars = index - numVars + 1;
            } else if (type === 'surplus' && index >= numVars + numSlackVars + numSurplusVars) {
                numSurplusVars = index - numVars - numSlackVars + 1;
            } else if (type === 'artificial' && index >= numVars + numSlackVars + numSurplusVars + numArtificialVars) {
                numArtificialVars = index - numVars - numSlackVars - numSurplusVars + 1;
            }
        }
        
        return {
            numVars,
            numSlackVars,
            numSurplusVars,
            numArtificialVars
        };
    }

    /**
     * Résout un problème de programmation linéaire avec la méthode du simplex
     * @param {Array} objectiveCoefficients - Coefficients de la fonction objectif
     * @param {Array} constraints - Tableau des contraintes
     * @param {String} objectiveType - Type d'objectif ('maximize' ou 'minimize')
     * @param {String} solutionMethod - Méthode de résolution ('standard', 'grand-m', 'two-phase')
     * @returns {Object} - Solution du problème
     */
    solve(objectiveCoefficients, constraints, objectiveType = 'maximize', solutionMethod = 'standard') {
        // Initialiser le tableau du simplex
        let { tableau, basicVars } = this.setupTableau(objectiveCoefficients, constraints, objectiveType, solutionMethod);
        
        // Résoudre avec la méthode appropriée
        if (solutionMethod === 'two-phase') {
            return this.solveTwoPhase(tableau, basicVars, objectiveCoefficients, constraints, objectiveType);
        } else {
            return this.solveStandard(tableau, basicVars);
        }
    }

    /**
     * Résout un problème avec la méthode standard du simplex
     * @param {Array} tableau - Tableau initial du simplex
     * @param {Array} basicVars - Variables de base initiales
     * @returns {Object} - Solution du problème
     */
    solveStandard(tableau, basicVars) {
        let result;
        let iteration = 0;
        const maxIterations = 100; // Limite pour éviter les boucles infinies
        
        do {
            // Effectuer une itération
            result = this.iterate(tableau, basicVars);
            tableau = result.tableau;
            basicVars = result.basicVars;
            iteration++;
            
            // Stocker l'itération
            if (!result.optimal && !result.unbounded) {
                this.iterations.push({
                    tableau: JSON.parse(JSON.stringify(tableau)),
                    basicVars: JSON.parse(JSON.stringify(basicVars)),
                    enteringVar: result.enteringVar,
                    leavingVar: result.leavingVar,
                    pivotRow: result.pivotRow,
                    pivotCol: result.pivotCol,
                    pivotElement: result.pivotElement,
                    phase: null
                });
            }
            
        } while (!result.optimal && !result.unbounded && iteration < maxIterations);
        
        // Extraire la solution
        return this.extractSolution(tableau, basicVars, result);
    }

    /**
     * Résout un problème avec la méthode des deux phases
     * @param {Array} tableau - Tableau initial du simplex
     * @param {Array} basicVars - Variables de base initiales
     * @param {Array} objectiveCoefficients - Coefficients de la fonction objectif originale
     * @param {Array} constraints - Contraintes originales
     * @param {String} objectiveType - Type d'objectif original
     * @returns {Object} - Solution du problème
     */
    solveTwoPhase(tableau, basicVars, objectiveCoefficients, constraints, objectiveType) {
        // Phase 1: Minimiser la somme des variables artificielles
        let phase1Tableau = JSON.parse(JSON.stringify(tableau));
        let phase1BasicVars = JSON.parse(JSON.stringify(basicVars));
        
        // Modifier la fonction objectif pour la phase 1
        phase1Tableau[0] = Array(phase1Tableau[0].length).fill(0);
        
        // Identifier les variables artificielles
        const artificialVarIndices = [];
        for (let i = 0; i < phase1BasicVars.length; i++) {
            if (phase1BasicVars[i].type === 'artificial') {
                artificialVarIndices.push(phase1BasicVars[i].index);
                phase1Tableau[0][phase1BasicVars[i].index] = 1;
            }
        }
        
        // Éliminer les variables artificielles de la fonction objectif
        for (let i = 1; i < phase1Tableau.length; i++) {
            const row = phase1Tableau[i];
            for (const artificialVarIndex of artificialVarIndices) {
                if (row[artificialVarIndex] !== 0) {
                    for (let j = 0; j < row.length; j++) {
                        phase1Tableau[0][j] -= row[j] * phase1Tableau[0][artificialVarIndex];
                    }
                    break;
                }
            }
        }
        
        // Résoudre la phase 1
        let result;
        let iteration = 0;
        const maxIterations = 100;
        
        do {
            result = this.iterate(phase1Tableau, phase1BasicVars);
            phase1Tableau = result.tableau;
            phase1BasicVars = result.basicVars;
            iteration++;
            
            // Stocker l'itération
            if (!result.optimal && !result.unbounded) {
                this.iterations.push({
                    tableau: JSON.parse(JSON.stringify(phase1Tableau)),
                    basicVars: JSON.parse(JSON.stringify(phase1BasicVars)),
                    enteringVar: result.enteringVar,
                    leavingVar: result.leavingVar,
                    pivotRow: result.pivotRow,
                    pivotCol: result.pivotCol,
                    pivotElement: result.pivotElement,
                    phase: 1
                });
            }
            
        } while (!result.optimal && !result.unbounded && iteration < maxIterations);
        
        // Vérifier si la phase 1 a une solution réalisable
        if (Math.abs(phase1Tableau[0][phase1Tableau[0].length - 1]) > 1e-10) {
            return {
                feasible: false,
                optimal: false,
                unbounded: false,
                objectiveValue: null,
                solution: null,
                iterations: this.iterations
            };
        }
        
        // Phase 2: Résoudre le problème original
        // Créer un nouveau tableau sans les variables artificielles
        const { numVars, numSlackVars, numSurplusVars } = this.getProblemDimensions(phase1BasicVars);
        const numArtificialVars = artificialVarIndices.length;
        
        let phase2Tableau = [];
        for (let i = 0; i < phase1Tableau.length; i++) {
            let row = [];
            for (let j = 0; j < phase1Tableau[i].length - numArtificialVars; j++) {
                row.push(phase1Tableau[i][j]);
            }
            row.push(phase1Tableau[i][phase1Tableau[i].length - 1]); // Ajouter la valeur RHS
            phase2Tableau.push(row);
        }
        
        // Réinitialiser la fonction objectif avec les coefficients originaux
        phase2Tableau[0] = Array(phase2Tableau[0].length).fill(0);
        for (let i = 0; i < objectiveCoefficients.length; i++) {
            phase2Tableau[0][i] = objectiveType === 'maximize' ? -objectiveCoefficients[i] : objectiveCoefficients[i];
        }
        
        // Éliminer les variables de base de la fonction objectif
        for (let i = 0; i < phase1BasicVars.length; i++) {
            const basicVarIndex = phase1BasicVars[i].index;
            if (basicVarIndex < phase2Tableau[0].length - 1) { // Ignorer les variables artificielles
                const basicVarCoeff = phase2Tableau[0][basicVarIndex];
                if (basicVarCoeff !== 0) {
                    for (let j = 0; j < phase2Tableau[0].length; j++) {
                        phase2Tableau[0][j] -= basicVarCoeff * phase2Tableau[i + 1][j];
                    }
                }
            }
        }
        
        // Filtrer les variables artificielles des variables de base
        let phase2BasicVars = phase1BasicVars.filter(v => v.type !== 'artificial');
        
        // Résoudre la phase 2
        iteration = 0;
        
        do {
            result = this.iterate(phase2Tableau, phase2BasicVars);
            phase2Tableau = result.tableau;
            phase2BasicVars = result.basicVars;
            iteration++;
            
            // Stocker l'itération
            if (!result.optimal && !result.unbounded) {
                this.iterations.push({
                    tableau: JSON.parse(JSON.stringify(phase2Tableau)),
                    basicVars: JSON.parse(JSON.stringify(phase2BasicVars)),
                    enteringVar: result.enteringVar,
                    leavingVar: result.leavingVar,
                    pivotRow: result.pivotRow,
                    pivotCol: result.pivotCol,
                    pivotElement: result.pivotElement,
                    phase: 2
                });
            }
            
        } while (!result.optimal && !result.unbounded && iteration < maxIterations);
        
        // Extraire la solution
        return this.extractSolution(phase2Tableau, phase2BasicVars, result);
    }

    /**
     * Extrait la solution à partir du tableau final
     * @param {Array} tableau - Tableau final du simplex
     * @param {Array} basicVars - Variables de base finales
     * @param {Object} result - Résultat de la dernière itération
     * @returns {Object} - Solution du problème
     */
    extractSolution(tableau, basicVars, result) {
        if (result.unbounded) {
            return {
                feasible: true,
                optimal: false,
                unbounded: true,
                objectiveValue: null,
                solution: null,
                iterations: this.iterations
            };
        }
        
        // Valeur de la fonction objectif
        let objectiveValue = tableau[0][tableau[0].length - 1];
        
        // Toujours utiliser la valeur absolue pour s'assurer que la valeur est positive
        // car dans la programmation linéaire, nous voulons généralement des valeurs positives
        objectiveValue = Math.abs(objectiveValue);
        
        // Si c'est un problème de minimisation, nous devons nous assurer que le signe est correct
        if (this.objectiveType === 'minimize') {
            // Dans certains cas, nous pourrions vouloir conserver le signe négatif pour la minimisation
            // mais pour la cohérence de l'interface utilisateur, nous utilisons la valeur absolue
        }
        
        // Extraire les valeurs des variables de décision
        const { numVars } = this.getProblemDimensions(basicVars);
        let solution = Array(numVars).fill(0);
        
        // Parcourir toutes les variables de base pour trouver les variables de décision
        for (let i = 0; i < basicVars.length; i++) {
            const basicVar = basicVars[i];
            if (basicVar.type === 'decision' && basicVar.index < numVars) {
                // Récupérer la valeur de la variable de base (dernière colonne du tableau)
                const value = tableau[i + 1][tableau[i + 1].length - 1];
                
                // Vérifier que la valeur est positive (ou zéro)
                solution[basicVar.index] = Math.max(0, value);
            }
        }
        
        // Vérifier que toutes les variables ont des valeurs définies
        for (let i = 0; i < solution.length; i++) {
            if (solution[i] === undefined || solution[i] === null || isNaN(solution[i])) {
                solution[i] = 0; // Assigner 0 aux variables non définies
            }
        }
        
        return {
            feasible: true,
            optimal: true,
            unbounded: false,
            objectiveValue,
            solution,
            iterations: this.iterations
        };
    }
}
