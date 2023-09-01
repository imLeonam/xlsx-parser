const fs = require('fs');
const XLSX = require('xlsx');

const requestFile = require('./utils/promptRequests');

function findSheetsName(workbook) {
    if (!workbook.Props.SheetNames) {
        console.log('Searching sheetName:', !!workbook.Props.SheetNames);
        return null;
    }
    if (workbook.Props.SheetNames.length === 1) {
        console.log('Searching sheetName:', !!workbook.Props.SheetNames[0]);
        return workbook.Props.SheetNames[0];
    }
}

function findReferenceKey(arr, sheet) {
    const matches = [];
    arr.forEach((item) => {
        const actual = sheet[item].w;
        if (/:/.test(actual)) {
            matches.push(actual);
        }
    });
    return matches[0];
}

function transformSheetToArray(sheet) {
    const arr = Object.keys(sheet);
    const newArr = [];
    let temp = [];

    const reference_key = findReferenceKey(arr, sheet);

    arr.forEach((item, index) => {
        const next = sheet[arr[index + 1]]?.w;
        const actual = sheet[item]?.w || '';
        temp.push(actual);
        if (next && next === reference_key) {
            newArr.push(temp);
            temp = [];
        }
    });
    return newArr;
}

function threatObjName(text) {
    if (!text) return;
    let formatText = text;
    if (/:/.test(formatText)) {
        formatText = formatText.replaceAll(':', '');
    }
    if (/ê/.test(formatText)) {
        formatText = formatText.replaceAll('ê', 'e');
    }
    if (/ó/.test(formatText)) {
        formatText = formatText.replaceAll('ó', 'o');
    }
    if (/ú/.test(formatText)) {
        formatText = formatText.replaceAll('ú', 'u');
    }
    if (/-/.test(formatText)) {
        formatText = formatText.replaceAll('-', '');
    }
    if (/ç/.test(formatText)) {
        formatText = formatText.replaceAll('ç', 'c');
    }
    if (/\./.test(formatText)) {
        formatText = formatText.replaceAll('.', '');
    }
    if (/ /.test(formatText)) {
        formatText = formatText.replaceAll(' ', '_');
    }
    formatText = formatText.toLowerCase();
    return formatText;
}

function cleanResult(arr, uniqueIdentifier) {
    uniqueIdentifier = threatObjName(uniqueIdentifier);
    const uniqueObjects = {};
    const result = [];

    for (const obj of arr) {
        const identifierValue = obj[uniqueIdentifier];
        if (!uniqueObjects[identifierValue]) {
            uniqueObjects[identifierValue] = true;
            if (obj) {
                result.push(obj);
            }
        }
    }

    return result;
}



function mountObject(array) {
    console.log('Mounting Objects...');
    if (!array) {
        console.log('Error: Empty array');
        return;
    }
    const keyPattern = /\b\w+: ?$/;
    const codePattern = /[0-9]*\.?[0-9]* - ?/;

    const response = array.map((element) => {
        if (!element) return;
        const object = {};
        return element.map((item, index) => {
            let actual = item;
            const next = element[index + 1];
            if (keyPattern.test(actual)) {
                actual = threatObjName(actual);
                if (keyPattern.test(next)) {
                    object[actual] = ''
                    return;
                }
                if (actual === 'codigo' && !keyPattern.test(element[index + 2])) {
                    object[actual] = next;
                    actual = 'nome'
                    const name = element[index + 2];
                    object[actual] = name;
                    return;
                }
                if (actual === 'material') {
                    const match = codePattern.exec(next);
                    object[actual] = next.replace(match, '');
                    actual = 'codigo';
                    if (match) {
                        const code = match[0].replaceAll('-', '').trim();
                        object[actual] = code;
                    }
                    return;
                }
                object[actual] = next;
                return;
            }
            return object;
        });
    });

    const formattedResponse = [];
    response.forEach((item) => {
        item.forEach((value) => {
            if (typeof value === 'object') {
                formattedResponse.push(value);
            }
        });
    });
    return cleanResult(formattedResponse, 'codigo');
}

function rewriteSheet(fileName) {
    const jsonFilePath = '_outputs/' + `${fileName.split('/')[1].replace('.xlsx', '')}` + '.json';
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const newFile = '_outputs/' + fileName.split('/')[1].replace('.xlsx', '').toLowerCase() + "_formatted";

    const ws = XLSX.utils.json_to_sheet(jsonData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const outputPath = `${newFile}.xlsx`;
    XLSX.writeFile(wb, outputPath);

    console.log(`XLSX file "${outputPath}" created.`);
}

async function runJob(directory, workbook) {
    console.group('Running job...');

    console.group('Reading file...');
    console.log('File name: ' + directory.split('/')[1]);

    const sheetname = findSheetsName(workbook);

    const sheet = workbook.Sheets[sheetname];

    const newArr = transformSheetToArray(sheet);
    console.log('Transforming sheet:', !!newArr, '\n');
    console.groupEnd();

    console.group('Mounting json structure: ');
    const result = mountObject(newArr);
    if (!result[1]) {
        console.log('Failed to Mount json structure.')
        console.log('Return: ', result);
        return;
    }
    console.log('Example return: ', result[1], '\n');
    console.groupEnd();

    console.group('Initializing export...');
    console.log(`Writing ${directory.split('/')[1].replace('.xlsx', '') + '.json'}`);
    fs.writeFileSync('_outputs/' + directory.split('/')[1].replace('.xlsx', '') + '.json', JSON.stringify(result, null, 2));
    console.log('Transfering json to xlsx...')
    rewriteSheet(directory);
    console.groupEnd();
    console.log('\nDone!!');
}

let directory = '';
requestFile().then((selectedFile) => {
    console.log(selectedFile)
    directory = '_inputs/' + selectedFile;
}).then(() => {
    const workbook = XLSX.readFile(directory);
    runJob(directory, workbook);
});
