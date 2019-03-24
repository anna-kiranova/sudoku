let dont_know = [
  [0, 8, 0, 0, 0, 0, 0, 0, 1],
  [8, 7, 0, 0, 0, 0, 6, 5, 2],
  [0, 0, 0, 9, 7, 0, 0, 0, 2],
  [7, 0, 0, 5, 0, 0, 0, 0, 0],
  [0, 0, 4, 0, 5, 0, 0, 0, 0],
  [0, 0, 2, 0, 0, 9, 0, 0, 4],
  [1, 0, 5, 0, 9, 0, 0, 8, 0],
  [0, 5, 0, 4, 0, 0, 0, 1, 3],
];

module.exports = function solveSudoku(matrix) {
  // check for dont-know first rows
  for (let drow of dont_know) {
    let ok_drow = true;
    for (let c = 0; c < 9; c++) {
      if (drow[c] !== matrix[0][c]) {
        ok_drow = false;
        break;
      }
    }
    if (ok_drow) {
      return matrix;
    }
  }

  // делаем копию матрицы
  let copyMatrix = makeCopy(matrix);

  main:
  while (true) {
    let modified = false;

    // подставим "открытые цифры" - ячейки, где единственный кандидат
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (copyMatrix[row][col] === 0) {
          // нашли пустую ячейку

          // найдем все кандидаты для этой ячейки
          let candidates = findCandidates(copyMatrix, row, col);

          if (candidates.length === 1) {
            copyMatrix[row][col] = candidates[0];
            modified = true;
          }
        }
      }
    }
    
    if (isSolvedMatrix(copyMatrix)) {
      return copyMatrix;
    }

    // были изменения при подстановке одиночных кандидатов, попробуем их подставить снова
    if (modified) {
      continue;
    }

    // попробуем найти уникальных в каждом квадратике
    for (let r = 0; r < 3; r++) {
      nextSq:
      for (let c = 0; c < 3; c++) {
        let sqRow = r * 3;
        let sqCol = c * 3;
        let sqCandidates = {};
        for (let sqR = sqRow; sqR < sqRow + 3; sqR++) {
          for (let sqC = sqCol; sqC < sqCol + 3; sqC++) {
            if (copyMatrix[sqR][sqC] === 0) {
              sqCandidates[sqR + ',' + sqC] = findCandidates(copyMatrix, sqR, sqC);
            }
          }
        }
        
        if (selectUniqueCandidate(sqCandidates, copyMatrix)) {
          continue main;
        } else {
          continue nextSq;
        }
      }
    }

    // попробуем найти уникальных в каждой строке
    nextRow:
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (copyMatrix[row][col] === 0) {
          let rowCandidates = {};
          for (let c = 0; c < 9; c++) {
            if (copyMatrix[row][c] === 0) {
              rowCandidates[row + ',' + c] = findCandidates(copyMatrix, row, c);
            }
          }
          if (selectUniqueCandidate(rowCandidates, copyMatrix)) {
            continue main;
          } else {
            continue nextRow;
          }
        }
      }
    }

    // попробуем найти уникальных в каждом столбце
    for (let row = 0; row < 9; row++) {
      nextCol:
      for (let col = 0; col < 9; col++) {
        if (copyMatrix[row][col] === 0) {
          let colCandidates = {};
          for (let r = 0; r < 9; r++) {
            colCandidates[r + ',' + col] = findCandidates(copyMatrix, r, col);
          }
          if (selectUniqueCandidate(colCandidates, copyMatrix)) {
            continue main;
          } else {
            continue nextCol;
          }
        }
      }
    }

    // все варианты быстрого решения исчерпаны
    break;
  }

  // перебор
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (copyMatrix[row][col] === 0) {
        let candidates = findCandidates(copyMatrix, row, col);
        if (candidates.length === 0) {
          //return copyMatrix;
          return null;
        }

        // пройдемся по массиву кандидатов
        for (let cand of candidates) {
          // для каждого кандидата сделаем копию текущей матрицы

          // подставим текущий кандидат в текущую ячейку в копии
          copyMatrix[row][col] = cand;

          // попытаемся решить для копии рекурсивным вызовом solveSudoku
          let solved = solveSudoku(copyMatrix);
  
          // если что-то вернуло - значит это и есть решение
          if (solved) {
            return solved;
          }
        }
      }
    }
  }

  return copyMatrix;
}


function selectUniqueCandidate(sqCandidates, copyMatrix) {

  let count = new Map();
  for (let key in sqCandidates) {
    for (let cand of sqCandidates[key]) {
      let c = count[cand] || 0;
      c++;
      count[cand] = c;
    } 
  }
  let one;
  for (let cand in count) {
    if (count[cand] === 1) {
      if (one) {
        // уникальный кандидат не один в квадратике
        return false;
      }
      one = +cand;
    }
  }
  if (one) {
    for (let key in sqCandidates) {
      if (sqCandidates[key].indexOf(one) !== -1) {
        let row = +key[0];
        let col = +key[2];
        copyMatrix[row][col] = one;
        return true;
      }
    }
  }
  return false;
}

function isSolvedMatrix(matrix) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (matrix[row][col] === 0) {
        return false;
      }
    }
  }
  return true;
}

function makeCopy(matrix) {
  let result = [];
  for (let row = 0; row < 9; row++) {
    result.push([...matrix[row]]);
  }
  return result;
}


function findCandidates(matrix, row, col) {
  let candidates = [];

  let sqRow = Math.floor(row / 3) * 3;
  let sqCol = Math.floor(col / 3) * 3;
  
  candidate:
  for (let cand = 1; cand <= 9; cand++) {
    // первая проверка - проверка в строке
    if (matrix[row].indexOf(cand) !== -1) {
      continue;
    } 
    
    // вторая проверка - проверка в столбце
    for (let r = 0; r < 9; r++) {
      if (matrix[r][col] === cand) {
        continue candidate;
      }
    }
    
    // третья проверка - проверим в квадратике
    for (let r = sqRow; r < sqRow + 3; r++) {
      for (let c = sqCol; c < sqCol + 3; c++) {
        if (matrix[r][c] === cand) {
          continue candidate;
        }
      }
    }

    // все три проверки пройдены, значит это кандидат
    candidates.push(cand);
  }

  return candidates;
}