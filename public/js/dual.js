/**
 * Classe pour résoudre des problèmes de programmation linéaire avec la méthode de la dualité
 */
class DualSolver {
    constructor() {
        this.simplexSolver = new SimplexSolver();
    }

    /**
     * Convertit un problème primal en son dual
     * @param {Array} objectiveCoefficients - Coefficients de la fonction objectif du primal
     * @param {Array} constraints - Contraintes du primal
     * @param {String} objectiveType - Type d'objectif du primal ('maximize' ou 'minimize')
     * @returns {Object} - Problème dual
     */
    convertToDual(objectiveCoefficients, constraints, objectiveType) {
        // Le type d'objectif du dual est l'opposé de celui du primal
        const dualObjectiveType = objectiveType === 'maximize' ? 'minimize' : 'maximize';
        
        // Les coefficients de la fonction objectif du dual sont les RHS des contraintes du primal
        const dualObjectiveCoefficients = constraints.map(constraint => constraint.rhs);
        
        // Les contraintes du dual sont dérivées des coefficients du primal
        const dualConstraints = [];
        
        for (let i = 0; i < objectiveCoefficients.length; i++) {
            const coefficients = constraints.map(constraint => constraint.coefficients[i] || 0);
            
            let type;
            if (objectiveType === 'maximize') {
                type = '>=';
            } else {
                type = '<=';
            }
            
            dualConstraints.push({
                coefficients,
                type,
                rhs: objectiveCoefficients[i]
            });
        }
        
        return {
            objectiveCoefficients: dualObjectiveCoefficients,
            constraints: dualConstraints,
            objectiveType: dualObjectiveType
        };
    }

    /**
     * Convertit une solution du dual en solution du primal
     * @param {Object} dualSolution - Solution du problème dual
     * @param {Array} primalConstraints - Contraintes du problème primal
     * @returns {Object} - Solution du problème primal
     */
    convertToPrimalSolution(dualSolution, primalConstraints) {
        if (!dualSolution.feasible || dualSolution.unbounded) {
            return dualSolution;
        }
        
        // Les valeurs des variables duales sont les valeurs des variables d'écart du primal
        const primalSolution = {
            feasible: dualSolution.feasible,
            optimal: dualSolution.optimal,
            unbounded: dualSolution.unbounded,
            objectiveValue: dualSolution.objectiveValue,
            solution: [],
            iterations: dualSolution.iterations
        };
        
        // Extraire les valeurs des variables primales à partir des valeurs marginales des contraintes duales
        const lastTableau = dualSolution.iterations[dualSolution.iterations.length - 1].tableau;
        
        // Dans le dual, les valeurs marginales des contraintes sont dans la première ligne du tableau final
        for (let i = 0; i < primalConstraints.length; i++) {
            const dualVarIndex = i;
            let primalVarValue = 0;
            
            // Chercher si la variable duale est dans la base
            for (let j = 1; j < lastTableau.length; j++) {
                const basicVarIndex = dualSolution.iterations[dualSolution.iterations.length - 1].basicVars[j - 1].index;
                if (basicVarIndex === dualVarIndex) {
                    primalVarValue = lastTableau[j][lastTableau[j].length - 1];
                    break;
                }
            }
            
            primalSolution.solution.push(primalVarValue);
        }
        
        return primalSolution;
    }

    /**
     * Résout un problème de programmation linéaire avec la méthode de la dualité
     * @param {Array} objectiveCoefficients - Coefficients de la fonction objectif du primal
     * @param {Array} constraints - Contraintes du primal
     * @param {String} objectiveType - Type d'objectif du primal ('maximize' ou 'minimize')
     * @returns {Object} - Solution du problème primal
     */
    solve(objectiveCoefficients, constraints, objectiveType) {
        // Convertir le problème primal en dual
        const dualProblem = this.convertToDual(objectiveCoefficients, constraints, objectiveType);
        
        // Résoudre le problème dual avec la méthode du simplex
        const dualSolution = this.simplexSolver.solve(
            dualProblem.objectiveCoefficients,
            dualProblem.constraints,
            dualProblem.objectiveType
        );
        
        // Convertir la solution du dual en solution du primal
        const primalSolution = this.convertToPrimalSolution(dualSolution, constraints);
        
        return {
            primalSolution,
            dualProblem,
            dualSolution
        };
    }

    /**
     * Génère une représentation textuelle du problème dual
     * @param {Object} dualProblem - Problème dual
     * @returns {String} - Représentation textuelle du problème dual
     */
    formatDualProblem(dualProblem) {
        const { objectiveCoefficients, constraints, objectiveType } = dualProblem;
        
        // Fonction objectif
        let formattedProblem = `${objectiveType === 'maximize' ? 'Maximiser' : 'Minimiser'} Z = `;
        
        for (let i = 0; i < objectiveCoefficients.length; i++) {
            const coeff = objectiveCoefficients[i];
            if (i > 0) {
                formattedProblem += coeff >= 0 ? ' + ' : ' - ';
                formattedProblem += `${Math.abs(coeff)}y${i + 1}`;
            } else {
                formattedProblem += `${coeff}y${i + 1}`;
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
                    formattedProblem += `${Math.abs(coeff)}y${j + 1}`;
                } else {
                    formattedProblem += `${coeff}y${j + 1}`;
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
            formattedProblem += `y${i + 1} ≥ 0`;
        }
        
        return formattedProblem;
    }
}
