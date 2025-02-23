import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// Function to extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const { value } = await mammoth.extractRawText({ buffer: dataBuffer });
  return value;
};

// Updated /match endpoint to support file uploads
app.post("/match", upload.single("resumeFile"), async (req, res) => {
  try {
    let { resume, jobDescription } = req.body;

    // If a file is uploaded, extract text from it
    if (req.file) {
      const filePath = req.file.path;
      const fileExtension = req.file.mimetype;

      try {
        let extractedText = "";
        
        if (fileExtension === "application/pdf") {
          extractedText = await extractTextFromPDF(filePath);
        } else if (fileExtension === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          extractedText = await extractTextFromDOCX(filePath);
        } else {
          return res.status(400).json({ error: "Invalid file type. Upload a PDF or DOCX file." });
        }

        // Remove the file after processing
        fs.unlinkSync(filePath);
        
        // Use the extracted text as the resume
        resume = extractedText;
      } catch (fileError) {
        return res.status(500).json({ error: "File processing failed", details: fileError.message });
      }
    }

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: "Missing resume text or job description" });
    }

    const prompt = `
      Compare the following resume with the given job description.
      - Provide a match percentage.
      - List missing skills (both hard & soft skills separately).
      - Explain why each skill is important for the role.
      - Give suggestions on how to improve the resume.

      Resume:
      ${resume}

      Job Description:
      ${jobDescription}

      ONLY return JSON. Do NOT include any extra text, no explanations, no markdown formatting.

      Example response format:
      {
        "match_percentage": 75,
        "missing_hard_skills": ["TypeScript"],
        "missing_soft_skills": ["Leadership"],
        "explanations": {
          "TypeScript": "TypeScript is essential for maintaining a scalable React codebase.",
          "Leadership": "Leadership experience is needed for managing teams and guiding junior developers."
        },
        "resume_improvements": [
          "Consider adding TypeScript experience to your resume.",
          "Highlight leadership roles in past projects or teams."
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Parse AI response
    let aiResponse;
    try {
      aiResponse = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error("AI Response Parsing Error:", parseError);
      return res.status(500).json({ error: "Invalid AI response format", details: parseError.message });
    }

    res.json(aiResponse);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
