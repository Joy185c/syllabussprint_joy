const fs = require('fs');

async function run() {
  console.log('Testing pdf-parse require:');
  const pdfParse = require('pdf-parse');
  console.log('pdfParse keys:', Object.keys(pdfParse));
  console.log('typeof pdfParse:', typeof pdfParse);
  if (typeof pdfParse === 'function') {
    console.log('IT IS A FUNCTION');
  } else if (pdfParse.default && typeof pdfParse.default === 'function') {
    console.log('DEFAULT IS FUNCTION');
  } else {
    console.log('NOT A FUNCTION');
  }
}

run();
