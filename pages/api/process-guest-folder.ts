import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import pdf from 'pdf-parse'; // Use pdf-parse library
import { Stream } from 'stream'; // Import Stream for type checking
import { OAuth2Client } from 'google-auth-library';

// --- Configuration & Constants ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const generationConfig = {
    temperature: 0.4, // Adjust creativity vs factuality
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096, // Adjust as needed
};
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// --- Type Definitions ---
type ProcessingResult = {
    status: 'verified' | 'missing_link' | 'missing_subfolder' | 'no_verifiable_file' | 'error';
    extractedName?: string | null;
    message?: string;
};
type DriveFile = { id: string; name: string; mimeType?: string | null };

// --- Helper Functions ---

// Extracts Folder ID from various Google Drive Link formats
function extractFolderIdFromLink(link: string): string | null {
    try {
        const url = new URL(link);
        // Common format: /folders/FOLDER_ID
        const pathSegments = url.pathname.split('/');
        const folderIndex = pathSegments.indexOf('folders');
        if (folderIndex !== -1 && pathSegments.length > folderIndex + 1) {
            return pathSegments[folderIndex + 1];
        }
        // Drive file viewer link with folder ID: ?id=FOLDER_ID
        if (url.pathname.endsWith('/drive/folders') && url.searchParams.has('id')) {
             return url.searchParams.get('id');
        }
        // Check resourcekey for shared folders
        if(url.searchParams.has('resourcekey')) {
            // This format usually needs the folder ID from the path *and* the resourcekey
            // For simplicity, if resourcekey exists, try getting ID from path first
             const potentialId = pathSegments[pathSegments.length - 1];
             // Basic check if it looks like an ID (alphanumeric, longer than ~10)
             if (potentialId && /^[a-zA-Z0-9_-]{10,}$/.test(potentialId)) {
                return potentialId;
             }
        }
         // Fallback: Try the last path segment if it looks like an ID
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && /^[a-zA-Z0-9_-]{10,}$/.test(lastSegment)) {
            return lastSegment;
        }
    } catch (e) {
        console.error('Error parsing Drive link URL:', e);
    }
    return null;
}

// Converts readable stream to buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

// --- API Handler ---

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ProcessingResult | { message: string }>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    if (!GEMINI_API_KEY) {
         console.error("Gemini API Key not configured");
         return res.status(500).json({ status: 'error', message: 'Server configuration error (Gemini Key Missing)' });
    }

    const { driveLink, subfolderName, parsingGoal, guestName } = req.query;

    if (!driveLink || typeof driveLink !== 'string' ||
        !subfolderName || typeof subfolderName !== 'string' ||
        !parsingGoal || typeof parsingGoal !== 'string' ||
        !guestName || typeof guestName !== 'string') {
        return res.status(400).json({ message: 'Missing required query parameters: driveLink, subfolderName, parsingGoal, guestName' });
    }

    console.log('Processing request:', { driveLink, subfolderName, parsingGoal, guestName });

    // --- Initialize Clients ---
    try {
        // Initialize Google Auth (using service account specified by env var)
        const credentials = process.env.GOOGLE_CREDENTIALS;
        if (!credentials) {
            throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
        }

        const auth = new GoogleAuth({
            credentials: JSON.parse(credentials),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        
        const authClient = (await auth.getClient()) as OAuth2Client;
        const drive = google.drive({ version: 'v3', auth: authClient });

        // Initialize Gemini Client
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use appropriate model

        // --- Core Logic ---

        // 1. Get Parent Folder ID from link
        const parentFolderId = extractFolderIdFromLink(driveLink);
        if (!parentFolderId) {
            console.warn(`Could not extract folder ID from link: ${driveLink}`);
            return res.status(200).json({ status: 'error', message: 'Invalid or unsupported Google Drive link format.' });
        }
        console.log(`Extracted Parent Folder ID: ${parentFolderId}`);

        // 2. Find the Subfolder ID (e.g., "IDs")
        let subfolderId: string | null = null;
        try {
            const folderSearchRes = await drive.files.list({
                q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${subfolderName}' and trashed = false`,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (folderSearchRes.data.files && folderSearchRes.data.files.length > 0) {
                subfolderId = folderSearchRes.data.files[0].id ?? null;
                console.log(`Found Subfolder '${subfolderName}' with ID: ${subfolderId}`);
            } else {
                console.warn(`Subfolder '${subfolderName}' not found in parent ${parentFolderId}`);
                return res.status(200).json({ status: 'missing_subfolder', message: `Subfolder '${subfolderName}' not found.` });
            }
        } catch (error: any) {
            console.error(`Error searching for subfolder '${subfolderName}' in ${parentFolderId}:`, error);
            // Check for common permission errors
            if (error.code === 403) {
                 return res.status(200).json({ status: 'error', message: 'Permission denied accessing the parent Google Drive folder.' });
            }
            if (error.code === 404) {
                 return res.status(200).json({ status: 'error', message: 'Parent Google Drive folder not found or link is incorrect.' });
            }
            throw error; // Rethrow other errors
        }

        if (!subfolderId) { // Should be caught above, but double-check
             return res.status(200).json({ status: 'missing_subfolder', message: `Subfolder '${subfolderName}' not found (ID resolution failed).` });
        }

        // 3. List files within the Subfolder
        let filesInSubfolder: DriveFile[] = [];
        try {
            const fileListRes = await drive.files.list({
                q: `'${subfolderId}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
                spaces: 'drive',
            });
            filesInSubfolder = (fileListRes.data.files as DriveFile[]) || [];
            console.log(`Found ${filesInSubfolder.length} files in subfolder ${subfolderId}`);
        } catch (error: any) {
             console.error(`Error listing files in subfolder ${subfolderId}:`, error);
             if (error.code === 403) {
                 return res.status(200).json({ status: 'error', message: `Permission denied accessing the '${subfolderName}' subfolder.` });
             }
             throw error;
        }

        if (filesInSubfolder.length === 0) {
            console.log(`No files found in subfolder ${subfolderId} for guest ${guestName}`);
            return res.status(200).json({ status: 'no_verifiable_file', message: `No files found in the '${subfolderName}' folder.` });
        }

        // 4. Iterate and Parse Files until match found
        let bestMatchResult: ProcessingResult | null = null;

        for (const file of filesInSubfolder) {
             console.log(`Processing file: ${file.name} (ID: ${file.id}, Type: ${file.mimeType})`);
            
            if (!file.id || !file.mimeType || !SUPPORTED_MIME_TYPES.includes(file.mimeType)) {
                console.log(`Skipping unsupported file type: ${file.mimeType}`);
                continue;
            }

            try {
                // 4a. Download file content
                const fileRes = await drive.files.get(
                    { fileId: file.id, alt: 'media' },
                    { responseType: 'stream' }
                );
                
                const fileBuffer = await streamToBuffer(fileRes.data as Stream);
                let fileDataPart: { inlineData: { data: string, mimeType: string } } | null = null;
                let textContent: string | null = null;

                // 4b. Prepare content for Gemini
                if (file.mimeType === 'application/pdf') {
                    // Extract text from PDF
                    try {
                        const data = await pdf(fileBuffer);
                        textContent = data.text;
                         console.log(`Extracted ${textContent?.length} chars from PDF: ${file.name}`);
                         if (!textContent || textContent.trim().length < 10) { // Skip if very little text
                            console.log("Skipping PDF with minimal text content.");
                            continue;
                         }
                    } catch (pdfError) {
                        console.error(`Error parsing PDF ${file.id}:`, pdfError);
                        // Store error for this file, but continue to next
                         if (!bestMatchResult || bestMatchResult.status !== 'verified') {
                             bestMatchResult = { status: 'error', message: `Failed to parse PDF: ${file.name}` };
                         }
                        continue; 
                    }
                } else { // Handle images
                    fileDataPart = {
                        inlineData: {
                            data: fileBuffer.toString('base64'),
                            mimeType: file.mimeType,
                        },
                    };
                }

                // 4c. Call Gemini API
                let prompt = "";
                if (parsingGoal === 'extract_name') {
                    prompt = `Analyze this document/image, which is supposed to be an identification document (like a passport, driver's license, ID card). Extract the full name of the person identified in the document. Only return the name. If you cannot confidently determine the name or it does not appear to be a valid ID document, respond with 'UNKNOWN'.`;
                    if (textContent) {
                         prompt += `\n\nDocument Text:\n${textContent.substring(0, 30000)}`; // Add text context, limit length
                    }
                } else {
                    // Add prompts for other parsingGoals later if needed
                    console.warn(`Unsupported parsingGoal: ${parsingGoal}`);
                    continue;
                }
                
                const parts = fileDataPart ? [ {text: prompt}, fileDataPart ] : [{text: prompt}];
                
                const result = await model.generateContent({ 
                   contents: [{ role: "user", parts }],
                   generationConfig,
                   safetySettings,
                });

                const response = result.response;
                const extractedText = response.text().trim();
                console.log(`Gemini response for ${file.id}:`, extractedText);

                // 4d. Check result
                if (extractedText && extractedText !== 'UNKNOWN' && extractedText.length > 2) { // Basic check
                     // Perform case-insensitive comparison, maybe remove titles like Ms./Mr.
                     const extractedNameCleaned = extractedText.replace(/^(mr|ms|mrs|dr)\.?\s+/i, '').trim();
                     const guestNameCleaned = guestName.replace(/^(mr|ms|mrs|dr)\.?\s+/i, '').trim();
                    
                     if (guestNameCleaned.toLowerCase() === extractedNameCleaned.toLowerCase()) {
                        console.log(`MATCH FOUND: Guest '${guestName}' matched extracted name '${extractedText}' from file ${file.name}`);
                        bestMatchResult = { status: 'verified', extractedName: extractedText };
                        break; // Exit file loop for this guest, we found a match
                     } else {
                          console.log(`Name mismatch: Guest='${guestNameCleaned}', Extracted='${extractedNameCleaned}'`);
                          // Store this as a potential issue if no better match is found
                           if (!bestMatchResult) {
                               bestMatchResult = { status: 'no_verifiable_file', message: `Found name '${extractedText}' in ${file.name}, but did not match guest '${guestName}'.` };
                           }
                     }
                } else {
                     // Gemini couldn't extract a name or returned UNKNOWN
                     if (!bestMatchResult) {
                         bestMatchResult = { status: 'no_verifiable_file', message: `Could not extract valid name from file ${file.name}.` };
                     }
                }

            } catch (fileProcessingError: any) {
                console.error(`Error processing file ${file.id} for guest ${guestName}:`, fileProcessingError);
                 if (!bestMatchResult || bestMatchResult.status !== 'verified') {
                     bestMatchResult = { status: 'error', message: `Error processing file ${file.name}: ${fileProcessingError.message}` };
                 }
                 // Continue to the next file, maybe it works
            }
        } // End file loop

        // 5. Return Final Result for the Guest
        if (bestMatchResult) {
            return res.status(200).json(bestMatchResult);
        } else {
            // Should have been caught earlier (e.g., no files found), but as fallback
            console.warn(`Reached end without result for guest ${guestName}. Subfolder had ${filesInSubfolder.length} files.`);
            return res.status(200).json({ status: 'no_verifiable_file', message: `Processed files in '${subfolderName}', but none were verifiable.` });
        }

    } catch (error: any) {
        console.error("Unhandled error in /api/process-guest-folder handler:", error);
        // Ensure a consistent error response format
        return res.status(500).json({ 
            status: 'error', 
            message: error.message || 'Internal Server Error' 
        });
    }
} 