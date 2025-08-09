/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import fs from "fs/promises";
import { Buffer } from "buffer";
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { PDFDocument } from "pdf-lib";

// Disable Next.js default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interface for parsed dialog lines
interface DialogLine {
  id?: number;
  character: string;
  dialog: string;
  action: string;
  emotion?: string;
  cue?: string;
  rawText: string; // Keep original for reference
}

// Helper: Read the raw body from the request
async function readRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("No body found");
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    if (value) chunks.push(value);
    done = doneReading;
  }
  return Buffer.concat(chunks);
}

async function splitPdfIntoPages(pdfBuffer: Buffer): Promise<Buffer[]> {
  const fullDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = fullDoc.getPageCount();
  const pages: Buffer[] = [];

  for (let i = 0; i < totalPages; i++) {
    const newDoc = await PDFDocument.create();
    const [page] = await newDoc.copyPages(fullDoc, [i]);
    newDoc.addPage(page);
    const singlePageBytes = await newDoc.save();
    pages.push(Buffer.from(singlePageBytes));
  }

  return pages;
}

function mergeNestedBlocks(finalData: any[]) {
  // Helper: check if boxB is inside boxA
  function isInside(boxA: any, boxB: any) {
    return (
      boxB.Left >= boxA.Left &&
      boxB.Top >= boxA.Top &&
      boxB.Left + boxB.Width <= boxA.Left + boxA.Width &&
      boxB.Top + boxB.Height <= boxA.Top + boxA.Height
    );
  }

  const merged: any[] = [];
  const usedChildIds = new Set<string>();

  for (let i = 0; i < finalData.length; i++) {
    const parent = finalData[i];

    // Skip if this block was already merged into another
    if (usedChildIds.has(parent.Id)) continue;

    const parentBox = parent.Geometry.BoundingBox;

    // Find children inside parent
    for (let j = 0; j < finalData.length; j++) {
      if (i === j) continue;
      const child = finalData[j];

      if (
        !usedChildIds.has(child.Id) &&
        isInside(parentBox, child.Geometry.BoundingBox)
      ) {
        parent.blockText.push(...child.blockText);
        usedChildIds.add(child.Id);
      }
    }

    merged.push(parent);
  }

  return merged;
}

function processTextract(response: any) {
  if (!response.Blocks) return [];

  const finalData: any[] = []
  response.Blocks.forEach((block: any) => {
    if (block.BlockType !== "PAGE" && block.BlockType !== "WORD" && block.BlockType !== "LINE" && block.BlockType !== "LAYOUT_FIGURE") {
      const blockText:string[] = []
      block.Relationships?.[0]?.Ids?.forEach((id: string) => {
        const childBlock = response.Blocks.find((b: any) => b.Id === id);
        if (childBlock) {
          let text = "";
          childBlock.Relationships?.[0]?.Ids?.forEach((wordId:string) => {
            const wordBlock = response.Blocks.find((b: any) => b.Id === wordId);
            if (wordBlock && wordBlock.Confidence > 50) {
              text += " " + wordBlock.Text;
            }
          })
          blockText.push(text)
        }
      });
      if (blockText.length > 0) {
        finalData.push({
          ...block, blockText
        })
      }
    }
  });


  return finalData;
}

const sortBlocksReadingOrder = (blocks: any[], tolerance = 0.01) => {
  return [...blocks].sort((a, b) => {
    const aBBox = a.Geometry.BoundingBox;
    const bBBox = b.Geometry.BoundingBox;
    
    // Calculate vertical centers and ranges
    const aCenterY = aBBox.Top + (aBBox.Height / 2);
    const bCenterY = bBBox.Top + (bBBox.Height / 2);
    
    // Check for vertical overlap (blocks on potentially same line)
    const aBottom = aBBox.Top + aBBox.Height;
    const bBottom = bBBox.Top + bBBox.Height;
    const verticalOverlap = Math.max(0, Math.min(aBottom, bBottom) - Math.max(aBBox.Top, bBBox.Top));
    const minHeight = Math.min(aBBox.Height, bBBox.Height);
    const overlapRatio = verticalOverlap / minHeight;
    
    // If significant vertical overlap (likely same line), sort by left position
    if (overlapRatio > 0.3) { // 30% overlap threshold
      return aBBox.Left - bBBox.Left;
    }
    
    // If centers are very close (within tolerance), use left position
    if (Math.abs(aCenterY - bCenterY) <= tolerance) {
      return aBBox.Left - bBBox.Left;
    }
    
    // Otherwise sort by vertical center (top to bottom)
    return aCenterY - bCenterY;
  });
};



export async function extractTextFromTextract(pdfBuffer: Buffer): Promise<any> {
  // Read from result.json file instead of calling AWS Textract
  try {
      const client = new TextractClient({ region: process.env.AWS_REGION });

    const pageBuffers = await splitPdfIntoPages(pdfBuffer);
    let finalResult:any[] = [];

    for (let i = 0; i < pageBuffers.length; i++) {
      const command = new AnalyzeDocumentCommand({
        Document: { Bytes: pageBuffers[i] },
        FeatureTypes: ["LAYOUT"],
      });

      const response:any = await client.send(command);
      const results  = processTextract(response)
      const megedResult = mergeNestedBlocks(results)
      const sortedResult = sortBlocksReadingOrder(megedResult)
      finalResult = [...finalResult, ...sortedResult]
      if(pdfBuffer.length > 2) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return finalResult.map(item => item.blockText)

    // Import fs dynamically to use in server-side code
    const fs = require('fs');
    const path = require('path');
    
    // Path to the result.json file
    const resultPath = path.join(process.cwd(), 'src/app/api/parse-script/result.json');
    
    // Read the file synchronously
    const response = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

        // Path to the result.json file
        const resultPath2 = path.join(process.cwd(), 'src/app/api/parse-script/result2.json');
    
        // Read the file synchronously
        const response2 = JSON.parse(fs.readFileSync(resultPath2, 'utf8'));
    
    
    const precessedData1 = processTextract(response)
    const precessedData2 = processTextract(response2)
    const mergedOutput1 = mergeNestedBlocks(precessedData1)
    const mergedOutput2 = mergeNestedBlocks(precessedData2)
    const sortOrder1 = sortBlocksReadingOrder(mergedOutput1)
    const sortOrder2 = sortBlocksReadingOrder(mergedOutput2)
    return [...sortOrder1, ...sortOrder2].map(item => item.blockText)
    // return mergedOutput
  } catch (error) {
    console.error("Error reading result.json:", error);
    throw error;
  }
}


// Combined AI verification, cleanup, and enrichment in batches
async function verifyCleanupAndEnrichBatch(dialogs: DialogLine[]): Promise<DialogLine[]> {
  if (dialogs.length === 0) return [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert script parser designed to extract dialog from messy AWS Textract output with 100% accuracy.

INPUT: Fragmented text arrays from PDF script extraction where dialog lines may be split, duplicated, or mixed with metadata.

CRITICAL RULES FOR 100% ACCURACY:

## PHASE 1: TEXT RECONSTRUCTION
1. **FLATTEN AND MERGE**: Combine all text fragments into a coherent sequence
2. **IDENTIFY PATTERNS**: Look for character names and their respective dialog content
3. **HANDLE FRAGMENTS**: Piece together split dialog lines that belong together
4. **PRESERVE ORDER**: Maintain the original sequence of actual dialog

## PHASE 2: CHARACTER NAME DETECTION
A valid character name is:
- ALL CAPS or Capitalized name
- Followed by dialog content (not stage directions)
- NOT any of these EXCLUSIONS:
  * Scene markers: "SCENE", "INT.", "EXT.", "FADE", "CUT TO"
  * Technical terms: "EXISTING", "ADDITIONAL", "CONTINUE", "END"
  * Metadata: timestamps, page numbers, service names
  * Action descriptions without character context
  * Single words that are clearly not names

## PHASE 3: DIALOG EXTRACTION
For each valid CHARACTER + DIALOG pair:
1. **Character**: Clean the name (remove "CONT'D", fix formatting, make uppercase)
2. **Dialog**: Extract the exact spoken words
3. **Action**: Only include parenthetical stage directions within dialog blocks
4. **Skip**: Any line that isn't actual character speech

## PHASE 4: ENRICHMENT
For each valid dialog line add:
- **Emotion**: Infer from context and content (urgent, confused, authoritative, panicked, etc.)
- **Cue**: Last unique word(s) for line triggering (2-4 words, lowercase, no punctuation)

## EXAMPLES OF WHAT TO SKIP:
❌ "SCENE 232"
❌ "EXISTING:"
❌ "Sides by Breakdown Services"
❌ Timestamps and metadata
❌ Standalone action lines

## OUTPUT FORMAT:
Return ONLY an array of valid dialog objects:

[
  {
    "id": 1,
    "character": "CHARACTER_NAME",
    "dialog": "exact spoken words",
    "action": "parenthetical actions only or empty string",
    "emotion": "inferred emotion",
    "cue": "unique trigger phrase"
  }
]

## QUALITY CHECKS:
- Every entry MUST have actual spoken dialog
- Character names MUST be real characters, not scene elements
- Maintain exact original dialog text
- Ensure cues are unique and meaningful
- No metadata, timestamps, or technical markers in output

Process the input and return ONLY the JSON array of valid dialog lines.
Example output: {lines: [{A valid output object}, {A valid output object}, ...]}`
        },
        {
          role: "user",
          content: `Process this batch of script data.

Data TO PROCESS:
${JSON.stringify({ lines: dialogs })}`
        }
      ]
    });

    const jsonString = response.choices[0].message.content;
    if (!jsonString) {
      throw new Error("Empty response from OpenAI processing");
    }

    const processed = JSON.parse(jsonString);
    const processedDialogs = processed.lines || [];

    return processedDialogs;
  } catch (e) {
    console.error("Error in combined processing:", e);
    // Return original dialogs if processing fails
    return dialogs;
  }
}

// Process all dialogs in batches with combined verification and enrichment
async function processAllDialogs(dialogs: DialogLine[]): Promise<DialogLine[]> {
  const BATCH_SIZE = dialogs.length > 60 ? 45 : dialogs.length; // Can be slightly larger since we're doing one API call per batch
  const processedDialogs: DialogLine[] = [];

  // Get a sample of original text for context (first 1500 chars to stay within limits)
  // const textSample = originalText.substring(0, 1500);

  for (let i = 0; i < dialogs.length; i += BATCH_SIZE) {
    const batch = dialogs.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dialogs.length / BATCH_SIZE)}`);

    const processedBatch = await verifyCleanupAndEnrichBatch(batch);
    processedDialogs.push(...processedBatch);

    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < dialogs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Reassign sequential IDs across all batches
  processedDialogs.forEach((dialog, index) => {
    dialog.id = index + 1;
  });

  return processedDialogs;
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting optimized script parsing...");

    // 1. Read PDF buffer from request
    const buffer = await readRawBody(req);
    if (!buffer || buffer.length === 0) throw new Error("No PDF uploaded");

    // 2. Extract text from PDF (now using cached result.json)
    const textractText = await extractTextFromTextract(buffer);
    console.log("Textract extracted text length:", textractText.length);

    // return NextResponse.json(textractText);

    if (!textractText) {
      throw new Error("No text extracted from PDF");
    }

    // 5. Combined AI verification, cleanup, and enrichment
    console.log("Step 2: AI verification, cleanup, and enrichment...");
    const processedDialogs = await processAllDialogs(textractText);

    if (processedDialogs.length === 0) {
      throw new Error("No valid dialog lines found after processing");
    }

    const result = {
      lines: processedDialogs,
    };

    console.log("Script parsing completed successfully");

    return NextResponse.json(result);

  } catch (e: any) {
    console.error("parse-script error:", e);
    return NextResponse.json({
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}