/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import PDFParser from 'pdf2json';
// import path from "path";
import fs from "fs/promises";
// import os from "os";
// import pdfPoppler from "pdf-poppler";
import { Buffer } from "buffer";



// Disable Next.js default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Helper: Convert PDF buffer to images (one per page)
// async function pdfBufferToImages(buffer: Buffer): Promise<string[]> {
//   const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-"));
//   console.log("tempDir", tempDir);
//   const pdfPath = path.join(tempDir, "input.pdf");
//   await fs.writeFile(pdfPath, buffer);
//   const fileName = "/Users/snehagupta/Desktop/ai-reader/client/TECHNICIAN.pdf";

//   const options = {
//     format: "png",
//     out_dir: path.dirname(fileName),
//     out_prefix: "page",
//     page: null, // all pages
//     scale: 2.0,
//   };
//   console.log(options);
//   console.log(pdfPath);
//   await pdfPoppler.convert(pdfPath, options);

//   const files = await fs.readdir(tempDir);
//   const imagePaths = files
//     .filter((f) => f.endsWith(".png"))
//     .map((f) => path.join(tempDir, f));
//   console.log(imagePaths);
//   return imagePaths;
// }

// async function pdfBufferToImages2(buffer: Buffer): Promise<string[]> {
//   const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-to-img-"));
//   const pdfPath = path.join(tempDir, "input.pdf");
//   console.log("pdfPath", pdfPath);
//   await fs.writeFile(pdfPath, buffer);

//   const images: string[] = [];
//   let counter = 1;
//   for await (const image of await pdf(pdfPath, { scale: 3 })) {
//     console.log("image", image);
//     const imagePath = path.join(tempDir, `page${counter}.png`);
//     await fs.writeFile(imagePath, image);
//     images.push(imagePath);
//     counter++;
//   }
//   return images;
// }

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

// Helper: Encode image file to base64
async function encodeImage(imagePath: string): Promise<string> {
  const data = await fs.readFile(imagePath);
  return data.toString("base64");
}

// Helper: Extract JSON from image using OpenAI Vision
async function extractJsonFromImage(imagePath: string,  sequenceBoolean: number): Promise<any> {
  const base64Image = await encodeImage(imagePath);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is a png file of a play script, you are tasked to extract the character name, the action and the dialog and convert it into a json output under a list name \"lines\", each roll of the script represent the sequence of the line, when one roll have two characters and lines run in parallel, it indicate the two characters will speak at the same time. Add \"squence\" to the data output with a boolean \"1\" and \"0\", each roll will switch betwern 1 and 0, if two or more people speak together, they share the same number to indicate they should speak together, the sequence start with \"${sequenceBoolean}\". The following is an example of the output: \n\n  \"squence\": \"\",\n  \"character\": \"\",\n  \"action\": \"\",\n  \"dialog\": \"\"\n\n`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64Image}` },
            },
          ],
        },
      ],
    });
    const jsonOutput = response.choices[0].message.content;
    return JSON.parse(jsonOutput || '{}');
  } catch (e) {
    console.error("Error extracting JSON from image:", e);
    return null;
  }
}

// Helper: Combine page JSONs
function combinePageJson(pageJsonList: any[]): any {
  const combined: any[] = [];
  for (const pageJson of pageJsonList) {
    const lines = pageJson?.lines || [];
    combined.push(...lines);
  }
  return { lines: combined };
}

// Helper: Add ids, emotion, and cues using OpenAI
async function addIdsAndCuesToJson(inputJson: any): Promise<any> {
  const systemPrompt = `You are an expert at processing play scripts. Given the following JSON input which contains a 'lines' array, update each entry as follows:\n1. Add an 'id' field before \"character\" with a number starting at 1, incrementing by 1 for each entry, placed before the 'character' field.\n2. Add a new 'emotion' field after the \"dialog\", based on the scene and the story, assign an emotion adjective to describe the voice of that line (such as angrily, peacefully, happily etc)\n3. Add a new field called 'cue' at the end. The 'cue' is a trigger word or phrase extracted from the end of the 'dialog'. The cue should normally be the last word of the dialog. However, if that word appears elsewhere in the dialog (at the start or in the middle), append the preceding word until a unique trigger phrase is found. If two words are not enough, add three and so on. The cue should not be a name, punctuation mark or a trivial word such as 'huh', 'wow', or 'ha ha'. The cue should be all in lower case. Return the updated JSON output with the new fields for each line.`;
  const userMessage = `Input JSON:\n\n${JSON.stringify(inputJson, null, 2)}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "developer", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    const outputJsonStr = response.choices[0].message.content;
    return JSON.parse(outputJsonStr || '{}');
  } catch (e) {
    console.error("Error adding ids/cues:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Fallback sample array
 const sampleScript = {
    lines: [
      {
        id: 1,
        character: "GABE",
        action: "",
        dialog: "I'll bet mobs of rioting Sudanese look pretty good right now.",
        emotion: "sarcastic",
        cue: "right now"
      },
      {
        id: 2,
        character: "PEN",
        action: "",
        dialog: "You have no idea. (TO PATIENT) Hello, Mr--",
        emotion: "matter-of-fact",
        cue: "Mr--"
      },
      {
        id: 3,
        character: "GABE",
        action: "",
        dialog: "Rodriguez. Fell off a chair.",
        emotion: "dry",
        cue: "chair"
      },
      {
        id: 4,
        character: "MR. RODRIGUEZ",
        action: "",
        dialog: "I hate hospitals. Really hate them.",
        emotion: "nervous",
        cue: "them"
      },
      {
        id: 5,
        character: "DR. LARA",
        action: "enters the room, glancing at the chart",
        dialog: "And yet here you are, breaking chairs like it's a sport.",
        emotion: "wry",
        cue: "sport"
      },
      {
        id: 6,
        character: "MR. RODRIGUEZ",
        action: "",
        dialog: "I swear it slipped. Not my fault this time.",
        emotion: "defensive",
        cue: "time"
      },
      {
        id: 7,
        character: "PEN",
        action: "raises an eyebrow at GABE",
        dialog: "That sounds oddly familiar.",
        emotion: "dry",
        cue: "familiar"
      },
      {
        id: 8,
        character: "GABE",
        action: "shrugs",
        dialog: "It’s the chairs, man. They're out to get us.",
        emotion: "mock-serious",
        cue: "us"
      },
      {
        id: 9,
        character: "DR. LARA",
        action: "smirks, checking vitals",
        dialog: "Next time, aim for a beanbag. Much safer.",
        emotion: "teasing",
        cue: "safer"
      },
      {
        id: 10,
        character: "MR. RODRIGUEZ",
        action: "",
        dialog: "Noted. Will avoid furniture with legs.",
        emotion: "resigned",
        cue: "legs"
      }
    ]
  };
  

  try {
    // 1. Read PDF buffer from request
    const buffer = await readRawBody(req);
    if (!buffer || buffer.length === 0) throw new Error("No PDF uploaded");
    console.log("buffer", buffer);

    // 2. Convert PDF to images
    // const imagePaths = await pdfBufferToImages(buffer);
    // const imagePaths = await pdfBufferToImages2(buffer);
    // console.log("imagePaths2", imagePaths);
    // if (!imagePaths || imagePaths.length === 0) throw new Error("PDF to image conversion failed");
    // console.log("imagePaths", imagePaths);

    // // 3. Extract JSON from each image
    // const allPageJson: any[] = [];
    // let sequenceBoolean = 0;
    // for (const imagePath of imagePaths) {
    //   const pageJson = await extractJsonFromImage(imagePath,  sequenceBoolean);
    //   if (pageJson) allPageJson.push(pageJson);
    //   sequenceBoolean = sequenceBoolean === 0 ? 1 : 0;
    // }
    // console.log("allPageJson", allPageJson);
    // if (allPageJson.length === 0) throw new Error("No JSON extracted from images");

    // // 4. Combine JSONs
    // const combinedJson = combinePageJson(allPageJson);
    // console.log("combinedJson", combinedJson);
    // // 5. Add ids, emotion, cues
    // const updatedJson = await addIdsAndCuesToJson(combinedJson);
    // console.log("updatedJson", updatedJson);
    // if (!updatedJson) throw new Error("Post-processing failed");

    return NextResponse.json(sampleScript);
  } catch (e) {
    console.error("parse-script fallback due to error:", e);
    return NextResponse.json(sampleScript);
  }
} 