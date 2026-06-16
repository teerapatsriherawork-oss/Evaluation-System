import fs from 'fs';
import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

async function main() {
    const data = new Uint8Array(fs.readFileSync('personnel.pdf'));
    const doc = await getDocument({ data }).promise;
    
    let allText = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        allText += `\n=== PAGE ${i} ===\n${text}\n`;
    }
    
    fs.writeFileSync('personnel-text.txt', allText, 'utf-8');
    console.log('Written to personnel-text.txt, total pages:', doc.numPages);
}

main().catch(e => console.error(e));
