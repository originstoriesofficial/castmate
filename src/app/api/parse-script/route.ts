/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import fs from "fs/promises";
import { Buffer } from "buffer";
import pdf from "pdf-extraction";

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

// Basic text-based dialog parser
function parseScriptText(rawText: string): DialogLine[] {
  const lines = rawText.split('\n');
  const dialogs: DialogLine[] = [];
  
  let currentCharacter = '';
  let currentDialog = '';
  let currentAction = '';
  let inDialogBlock = false;
  let dialogBuffer: string[] = [];
  
  // Common script formatting patterns
  const characterNamePattern = /^[A-Z][A-Z\s]+(?:\s*\(CONT'D\))?$/;
  const sceneHeaderPattern = /^(INT\.|EXT\.|FADE IN|FADE OUT|CUT TO|TITLE CARD|THE END)/i;
  const actionPattern = /^\s*\([^)]*\)\s*$/;
  const continuedPattern = /\(CONT'D\)/gi;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Skip scene headers, transitions, and title elements
    if (sceneHeaderPattern.test(line) || 
        line.startsWith('By') || 
        line.match(/^\d+\.?$/) || // page numbers
        line.length < 2) {
      continue;
    }
    
    // Check if this is a character name
    const isCharacterName = characterNamePattern.test(line) && 
                           !line.includes('.') && 
                           !line.includes('?') && 
                           !line.includes('!') &&
                           line.length < 50; // Character names shouldn't be too long
    
    if (isCharacterName) {
      // Save previous dialog if exists
      if (currentCharacter && currentDialog) {
        dialogs.push({
          character: currentCharacter.replace(continuedPattern, '').trim(),
          dialog: currentDialog.trim(),
          action: currentAction.trim(),
          rawText: `${currentCharacter}\n${currentAction}\n${currentDialog}`
        });
      }
      
      // Start new character dialog
      currentCharacter = line;
      currentDialog = '';
      currentAction = '';
      inDialogBlock = true;
      continue;
    }
    
    // If we're in a dialog block
    if (inDialogBlock && currentCharacter) {
      // Check if it's an action line (parenthetical)
      if (actionPattern.test(line)) {
        currentAction += (currentAction ? ' ' : '') + line;
      } else if (line.startsWith('(') && line.endsWith(')')) {
        // Inline action
        currentAction += (currentAction ? ' ' : '') + line;
      } else {
        // It's dialog
        currentDialog += (currentDialog ? ' ' : '') + line;
      }
    }
  }
  
  // Don't forget the last dialog
  if (currentCharacter && currentDialog) {
    dialogs.push({
      character: currentCharacter.replace(continuedPattern, '').trim(),
      dialog: currentDialog.trim(),
      action: currentAction.trim(),
      rawText: `${currentCharacter}\n${currentAction}\n${currentDialog}`
    });
  }
  
  // Add sequential IDs
  dialogs.forEach((dialog, index) => {
    dialog.id = index + 1;
  });
  
  return dialogs;
}

// Combined AI verification, cleanup, and enrichment in batches
async function verifyCleanupAndEnrichBatch(dialogs: DialogLine[], originalTextSample: string): Promise<DialogLine[]> {
  if (dialogs.length === 0) return [];
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a script processing expert. Your job is to verify, clean up, and enrich parsed script data in one step.

PHASE 1 - VERIFICATION & CLEANUP:
1. MAINTAIN EXACT ORDER of valid dialog lines - Never reorder
2. REMOVE INVALID ENTRIES that shouldn't be dialog:
   - Scene headers (INT./EXT./FADE IN/FADE OUT/CUT TO)
   - Stage directions not in parentheses  
   - Title cards, chapter headings, page numbers
   - Author names, credits, timestamps
   - Standalone action lines (not parenthetical dialog actions)
   - Any line that's not actual character speech
   - Any directions or moments that are not part of dialogs like Pause etc.

3. KEEP & FIX VALID DIALOG:
   - Character name followed by spoken dialog
   - Parenthetical actions within dialog blocks
   - Merge split dialog lines for same character
   - Separate incorrectly combined character lines
   - Clean character names (remove CONT'D, fix capitalization)

4. VALIDATE CHARACTER NAMES:
   - Must be actual character names, not scene descriptions
   - Remove any that are clearly not characters
   - Maintain the character name exactly as it is in script but make it uppercase.

PHASE 2 - ENRICHMENT (for valid dialog lines only):
1. Add 'emotion': How the line should be delivered based on context:
   - Consider scene context and character relationships
   - Use descriptive emotions: "angrily", "sadly", "confidently", "nervously", "mockingly", "desperately", "sarcastically", "pleadingly", etc.
   - Base on actual dialog content and dramatic situation

2. Add 'cue': Last unique word(s) from dialog for triggering next line:
   - Usually the last word unless it appears elsewhere in dialog
   - If not unique, use last 2-3 words until unique  
   - Avoid names, punctuation, trivial words ("huh", "wow", "yeah")
   - Convert to lowercase
   - Avoid fullstops or commas that might be at the end of sentences
   - Must be a clear, distinctive trigger phrase

OUTPUT FORMAT for each valid dialog line:
{
  "id": sequential_number_starting_from_1,
  "character": "cleaned_character_name",
  "dialog": "actual_spoken_words_exactly_as_written",
  "action": "parenthetical_actions_only",
  "emotion": "delivery_emotion",
  "cue": "trigger_phrase"
}

Return ONLY valid, cleaned, enriched dialog lines in given JSON format in correct order.`
        },
        {
          role: "user",
          content: `Process this batch of parsed script data. Remove invalid entries, fix parsing errors, and enrich valid dialog lines with emotions and cues.

PARSED BATCH TO PROCESS:
${JSON.stringify({ lines: dialogs }, null, 2)}`
        }
      ]
    });

    const jsonString = response.choices[0].message.content;
    if (!jsonString) {
      throw new Error("Empty response from OpenAI processing");
    }

    const processed = JSON.parse(jsonString);
    const processedDialogs = processed.lines || [];
    
    console.log(`Batch processed: ${dialogs.length} → ${processedDialogs.length} lines`);
    
    return processedDialogs;
  } catch (e) {
    console.error("Error in combined processing:", e);
    // Return original dialogs if processing fails
    return dialogs;
  }
}

// Process all dialogs in batches with combined verification and enrichment
async function processAllDialogs(dialogs: DialogLine[], originalText: string): Promise<DialogLine[]> {
  const BATCH_SIZE = dialogs.length > 45 ? 30 : dialogs.length; // Can be slightly larger since we're doing one API call per batch
  const processedDialogs: DialogLine[] = [];
  
  // Get a sample of original text for context (first 1500 chars to stay within limits)
  const textSample = originalText.substring(0, 1500);
  
  for (let i = 0; i < dialogs.length; i += BATCH_SIZE) {
    const batch = dialogs.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(dialogs.length/BATCH_SIZE)}`);
    
    const processedBatch = await verifyCleanupAndEnrichBatch(batch, textSample);
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

// Simplified validation function for the combined approach
function validateProcessing(original: DialogLine[], processed: DialogLine[]): {isValid: boolean, issues: string[]} {
  const issues: string[] = [];
  
  // Check if processing removed too many lines (might indicate over-filtering)
  if (processed.length < original.length * 0.3) {
    issues.push(`Processing removed ${original.length - processed.length} lines (${Math.round((1 - processed.length/original.length) * 100)}% of original) - possible over-filtering`);
  }
  
  // Validate that all processed lines have required fields
  for (let i = 0; i < processed.length; i++) {
    const line = processed[i];
    if (!line.character || !line.dialog) {
      issues.push(`Line ${i + 1} missing required character or dialog field`);
    }
    if (!line.emotion || !line.cue) {
      issues.push(`Line ${i + 1} missing enrichment fields (emotion or cue)`);
    }
  }
  
  const isValid = issues.length === 0;
  return { isValid, issues };
}

// Clean and normalize text before processing
function preprocessText(rawText: string): string {
  return rawText
    // Remove excessive whitespace
    .replace(/\s{3,}/g, '\n\n')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove page breaks and form feeds
    .replace(/\f/g, '\n')
    // Clean up common OCR artifacts
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting optimized script parsing...");
    
    // 1. Read PDF buffer from request
    const buffer = await readRawBody(req);
    if (!buffer || buffer.length === 0) throw new Error("No PDF uploaded");
    
    // 2. Extract text from PDF
    const data = await pdf(buffer);
    console.log("Extracted text length:", data.text.length);
    
    // 3. Preprocess the raw text
    const cleanText = preprocessText(data.text);
    console.log("Clean text preview:", cleanText.substring(0, 500));
    
    // 4. Basic parsing to extract dialog structure
    console.log("Step 1: Basic pattern-based parsing...");
    const basicParsing = parseScriptText(cleanText);
    console.log(`Basic parsing found ${basicParsing.length} potential dialog lines`);
    
    if (basicParsing.length === 0) {
      throw new Error("No dialog lines found in basic parsing");
    }
    
    // 5. Combined AI verification, cleanup, and enrichment
    console.log("Step 2: AI verification, cleanup, and enrichment...");
    const processedDialogs = await processAllDialogs(basicParsing, cleanText);
    console.log(`Processing completed: ${basicParsing.length} → ${processedDialogs.length} final dialog lines`);
    
    if (processedDialogs.length === 0) {
      throw new Error("No valid dialog lines found after processing");
    }
    
    // 6. Final validation
    const validation = validateProcessing(basicParsing, processedDialogs);
    
    if (!validation.isValid) {
      console.warn("Validation issues detected:", validation.issues);
    }
    
    const result = {
      lines: processedDialogs,
      stats: {
        originalLines: basicParsing.length,
        finalLines: processedDialogs.length,
        removedLines: basicParsing.length - processedDialogs.length,
        processingEfficiency: Math.round((processedDialogs.length / basicParsing.length) * 100) + "%"
      },
      validation: validation
    };
    
    console.log("Script parsing completed successfully");
    console.log("Final stats:", result.stats);
    
    return NextResponse.json(result);
    
  } catch (e: any) {
    console.error("parse-script error:", e);
    return NextResponse.json({ 
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}