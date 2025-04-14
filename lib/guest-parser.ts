import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GuestData {
  id: string;
  name: string;
  email: string;
  phone: string;
  pickupLocation: string;
  arrivalDate: string;
  arrivalTime: string;
  numberOfGuests: number;
  driveLink: string;
}

// Get environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GOOGLE_DRIVE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;

// Validate API keys
if (!GOOGLE_DRIVE_API_KEY) {
  throw new Error('NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY environment variable is not set');
}

// Initialize Gemini if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Add custom logger
const logger = {
  group: (name: string) => {
    console.group(`🔍 ${name}`);
  },
  groupEnd: () => {
    console.groupEnd();
  },
  info: (msg: string, data?: any) => {
    console.log(`ℹ️ ${msg}`, data || '');
  },
  success: (msg: string, data?: any) => {
    console.log(`✅ ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`❌ ${msg}`, error || '');
  },
  warn: (msg: string, data?: any) => {
    console.warn(`⚠️ ${msg}`, data || '');
  }
};

export function parseCSVData(csvData: string): GuestData[] {
  logger.group('CSV Parsing');
  
  try {
    const lines = csvData.split('\n');
    logger.info(`Found ${lines.length} lines in CSV`);
    
    const headers = lines[0].split(',').map(header => header.trim().replace(/^"(.*)"$/, '$1'));
    logger.info('CSV Headers:', headers);
    
    // Find the indexes of the columns we care about
    const nameIndex = headers.indexOf('Name');
    const phoneIndex = headers.indexOf('Phone Number');
    const driveLinkIndex = headers.indexOf('Drive link');
    
    logger.info('Column Indexes:', { nameIndex, phoneIndex, driveLinkIndex });
    
    if (nameIndex === -1 || phoneIndex === -1 || driveLinkIndex === -1) {
      throw new Error('CSV must contain Name, Phone Number, and Drive link columns');
    }
    
    const guests = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(value => value.trim().replace(/^"(.*)"$/, '$1'));
      
      const guest: GuestData = {
        id: (index + 1).toString(),
        name: values[nameIndex] || '',
        email: '',
        phone: values[phoneIndex] || '',
        pickupLocation: '',
        arrivalDate: '',
        arrivalTime: '',
        numberOfGuests: 1,
        driveLink: values[driveLinkIndex] || '',
      };

      logger.info(`Guest ${index + 1}:`, guest);
      return guest;
    });

    logger.success(`Parsed ${guests.length} guests successfully`);
    logger.groupEnd();
    return guests;
  } catch (err) {
    logger.error('Failed to parse CSV', err);
    logger.groupEnd();
    throw err;
  }
}

// Return only fileId and mimeType, as downloadUrl is not reliable for server-side fetch
async function getDirectFileUrl(parentFolderId: string): Promise<{ fileId: string; mimeType: string } | null> {
  logger.group('Google Drive File Lookup');
  
  try {
    logger.info('Looking up Tickets folder in:', parentFolderId);
    
    // Step 1: Find the Tickets folder
    // Note: Using name contains to handle case sensitivity
    const folderListUrl = `https://www.googleapis.com/drive/v3/files?q=name contains 'Tickets' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,mimeType)&key=${GOOGLE_DRIVE_API_KEY}`;
    logger.info('Searching for Tickets folder...');
    logger.info('API URL:', folderListUrl);
    
    const folderResponse = await fetch(folderListUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!folderResponse.ok) {
      const errorText = await folderResponse.text();
      throw new Error(`Failed to fetch Tickets folder: ${folderResponse.statusText} (${folderResponse.status})\n${errorText}`);
    }

    const folderData = await folderResponse.json();
    logger.info('Folder search result:', folderData);
    
    const ticketsFolderId = folderData.files?.[0]?.id;
    if (!ticketsFolderId) {
      logger.warn('No Tickets folder found in the parent folder');
      logger.groupEnd();
      return null;
    }
    
    logger.success('Found Tickets folder:', ticketsFolderId);

    // Step 2: Look for files in the Tickets folder
    // Only request necessary fields: id, name, mimeType
    const filesListUrl = `https://www.googleapis.com/drive/v3/files?q='${ticketsFolderId}' in parents and (mimeType contains 'image/' or mimeType='application/pdf') and trashed=false&fields=files(id,name,mimeType)&orderBy=createdTime desc&key=${GOOGLE_DRIVE_API_KEY}`;
    logger.info('Looking for ticket files in Tickets folder...');
    logger.info('API URL:', filesListUrl);
    
    const filesResponse = await fetch(filesListUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!filesResponse.ok) {
      const errorText = await filesResponse.text();
      throw new Error(`Failed to fetch ticket files: ${filesResponse.statusText} (${filesResponse.status})\n${errorText}`);
    }

    const filesData = await filesResponse.json();
    logger.info('Files in Tickets folder:', filesData);
    
    const firstFile = filesData.files?.[0];
    // Check only for id and mimeType
    if (!firstFile?.id || !firstFile?.mimeType) {
      logger.warn('No ticket files found in Tickets folder or file missing required info');
      logger.groupEnd();
      return null;
    }
    
    logger.success('Found ticket file:', { 
      id: firstFile.id, 
      type: firstFile.mimeType, 
      name: firstFile.name,
    });
    logger.groupEnd();
    // Return only fileId and mimeType
    return { fileId: firstFile.id, mimeType: firstFile.mimeType };

  } catch (err) {
    logger.error('Failed to get file URL', err);
    if (err instanceof Error) {
      logger.error('API Error details:', {
        message: err.message,
        stack: err.stack
      });
    }
    logger.groupEnd();
    return null;
  }
}

async function parseImageTicketWithGemini(fileId: string, mimeType: string): Promise<any> {
  logger.group('Image Parsing');
  logger.info('Parsing image ticket via API:', { fileId, mimeType });
  
  try {
    if (!genAI) {
      throw new Error('Gemini API not initialized');
    }
    if (!GOOGLE_DRIVE_API_KEY) {
      throw new Error('Google Drive API Key not available');
    }

    // Step 1: Download image using Google Drive API
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
    logger.info('Fetching image content from API:', downloadUrl);
    
    const imageResponse = await fetch(downloadUrl);
    if (!imageResponse.ok) {
      let errorBody = '';
      try {
        errorBody = await imageResponse.text();
      } catch (e) { /* Ignore */ }
      throw new Error(`Failed to download image from Drive API: ${imageResponse.statusText} (Status: ${imageResponse.status}). Body: ${errorBody}`);
    }

    logger.success('Image content fetched successfully');
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    logger.info('Image converted to base64');

    // Step 2: Send base64 data to Gemini
    // Use the recommended gemini-1.5-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    logger.info('Sending image data to Gemini (model: gemini-1.5-flash)...');
    
    const result = await model.generateContent([
      "Extract the following information from this ticket/boarding pass: arrival date, arrival time, arrival location, flight/train/bus number, and number of travelers. Return the data in JSON format with these exact keys: arrivalDate, arrivalTime, pickupLocation, flightNumber, trainNumber, busNumber, numberOfGuests. If a value is not present, return null for that key.",
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ]);
    
    const geminiResponse = await result.response;
    const text = geminiResponse.text();
    logger.info('Received Gemini response:', text);
    
    // Handle JSON parsing
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        logger.success('Parsed ticket details from Gemini response (markdown)');
        logger.groupEnd();
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error(`Gemini response is not valid JSON: ${text}`);
    }

    logger.success('Parsed ticket details from Gemini response');
    logger.groupEnd();
    return JSON.parse(text);

  } catch (error) {
    logger.error('Error parsing image ticket:', error);
    if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    logger.groupEnd();
    return null;
  }
}

async function parsePdfTicketWithGemini(fileId: string): Promise<any> {
  logger.group('PDF Parsing (Experimental)');
  logger.info('Parsing PDF ticket via API:', { fileId });
  
  try {
    if (!genAI) {
      throw new Error('Gemini API not initialized');
    }
     if (!GOOGLE_DRIVE_API_KEY) {
      throw new Error('Google Drive API Key not available');
    }

    // Step 1: Download PDF using Google Drive API
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
    logger.info('Fetching PDF content from API:', downloadUrl);
    
    const pdfResponse = await fetch(downloadUrl);
    if (!pdfResponse.ok) {
      let errorBody = '';
      try {
        errorBody = await pdfResponse.text();
      } catch (e) { /* Ignore */ }
      throw new Error(`Failed to download PDF from Drive API: ${pdfResponse.statusText} (Status: ${pdfResponse.status}). Body: ${errorBody}`);
    }

    logger.success('PDF content fetched successfully');
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Data = Buffer.from(pdfBuffer).toString('base64');
    logger.info('PDF converted to base64');

    // Step 2: Send base64 data to Gemini
    // Use the recommended gemini-1.5-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 
    logger.info('Sending PDF data to Gemini (model: gemini-1.5-flash)...');
    
    const result = await model.generateContent([
      "You are being provided with a PDF document which is likely a travel ticket or boarding pass. Extract the following information: arrival date, arrival time, arrival location, flight/train/bus number, and number of travelers. Return the data in JSON format with these exact keys: arrivalDate, arrivalTime, pickupLocation, flightNumber, trainNumber, busNumber, numberOfGuests. If a value is not present, return null for that key.",
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ]);

    const geminiResponse = await result.response;
    const text = geminiResponse.text();
    logger.info('Received Gemini response for PDF:', text);

    // Handle JSON parsing
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        logger.success('Parsed ticket details from Gemini response (markdown)');
        logger.groupEnd();
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error(`Gemini response for PDF is not valid JSON: ${text}`);
    }

    logger.success('Parsed ticket details from Gemini response');
    logger.groupEnd();
    return JSON.parse(text);

  } catch (error) {
    logger.error('Error parsing PDF ticket:', error);
     if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    logger.groupEnd();
    return null;
  }
}

export async function processGuestTickets(guest: GuestData): Promise<GuestData> {
  try {
    logger.group(`Processing Guest: ${guest.name}`);
    
    if (!guest.driveLink) {
      logger.warn(`No drive link provided for guest ${guest.name} - skipping ticket processing`);
      logger.groupEnd();
      return guest;
    }
    logger.info('Drive link:', guest.driveLink);

    // Extract parent folder ID from Drive link
    const parentFolderId = guest.driveLink.match(/(?:\/folders\/|\/file\/d\/|id=)([a-zA-Z0-9-_]+)/)?.[1];
    if (!parentFolderId) {
      logger.warn(`Invalid drive link format for guest ${guest.name} - skipping ticket processing`);
      logger.groupEnd();
      return guest;
    }
    logger.info('Extracted folder ID:', parentFolderId);

    logger.info('Fetching ticket file information...');
    let ticketDetails: any = null;
    try {
      // Get only fileId and mimeType
      const fileInfo = await getDirectFileUrl(parentFolderId);
      if (!fileInfo) {
        logger.warn(`No ticket files found for guest ${guest.name} - this is expected if tickets have not been uploaded yet`);
        logger.groupEnd();
        return guest;
      }
      
      // Destructure fileId and mimeType
      const { fileId, mimeType } = fileInfo;
      logger.info('Processing file ID:', { fileId, mimeType });

      // Pass fileId and mimeType to parsing functions
      if (mimeType.startsWith('image/')) {
        logger.info('Processing as image...');
        ticketDetails = await parseImageTicketWithGemini(fileId, mimeType);
      } else if (mimeType === 'application/pdf') {
        logger.info('Processing as PDF...');
        ticketDetails = await parsePdfTicketWithGemini(fileId);
      } else {
        logger.warn(`Unsupported file type (${mimeType}) found for guest ${guest.name} - skipping ticket processing`);
      }

      if (ticketDetails) {
        logger.success(`✨ Successfully found and processed ticket for ${guest.name}`);
        logger.info('Extracted ticket details:', ticketDetails);
        // Update guest with ticket details
        guest.arrivalDate = ticketDetails.arrivalDate || guest.arrivalDate;
        guest.arrivalTime = ticketDetails.arrivalTime || guest.arrivalTime;
        guest.pickupLocation = ticketDetails.pickupLocation || guest.pickupLocation;
        guest.numberOfGuests = ticketDetails.numberOfGuests || guest.numberOfGuests;
        logger.info('Updated guest data:', guest);
      } else {
        logger.warn(`Could not extract ticket details for guest ${guest.name} - keeping default values`);
      }
    } catch (err) {
      logger.error(`Error processing ticket for guest ${guest.name}:`, err);
      if (err instanceof Error) {
        logger.error('Error details:', {
          message: err.message,
          stack: err.stack,
          cause: err.cause
        });
      }
    }

    logger.groupEnd();
    return guest;
  } catch (err) {
    logger.error(`Error in processGuestTickets for guest ${guest.name}:`, err);
    if (err instanceof Error) {
      logger.error('Error details:', {
        message: err.message,
        stack: err.stack,
        cause: err.cause
      });
    }
    logger.groupEnd();
    return guest;
  }
}

export async function fetchAndProcessGuests(sheetId: string, gid: string = '0'): Promise<GuestData[]> {
  try {
    logger.group('Guest Data Processing');
    logger.info('Sheet ID:', sheetId);
    logger.info('GID:', gid);

    logger.info('Fetching spreadsheet data...');
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
    }
    
    const csvData = await response.text();
    logger.success('Successfully fetched spreadsheet data');
    
    logger.info('Parsing guest data from CSV...');
    const guests = parseCSVData(csvData);
    logger.info(`Found ${guests.length} guests to process`);
    
    logger.info('Processing tickets for each guest...');
    const processedGuests = await Promise.all(guests.map(async (guest, index) => {
      logger.info(`Processing Guest ${index + 1}/${guests.length}: ${guest.name}`);
      return processGuestTickets(guest);
    }));
    
    // Summary of ticket processing
    const guestsWithTickets = processedGuests.filter(g => g.pickupLocation);
    logger.success('\n=== Ticket Processing Summary ===');
    logger.info(`Total guests processed: ${processedGuests.length}`);
    logger.info(`Guests with tickets found: ${guestsWithTickets.length}`);
    if (guestsWithTickets.length > 0) {
      logger.success('Tickets found for:');
      guestsWithTickets.forEach(g => logger.info(`- ${g.name} (Pickup: ${g.pickupLocation})`));
    }
    logger.info(`Guests without tickets: ${processedGuests.length - guestsWithTickets.length}`);
    if (processedGuests.length - guestsWithTickets.length > 0) {
      logger.warn('No tickets found for:');
      processedGuests.filter(g => !g.pickupLocation).forEach(g => logger.info(`- ${g.name}`));
    }
    logger.success('=== End Summary ===\n');
    
    logger.groupEnd();
    return processedGuests;
  } catch (error) {
    logger.error('Error in fetchAndProcessGuests:', error);
    if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    logger.groupEnd();
    return [];
  }
}

// Add this test function after the existing functions
export async function testDriveFolder(folderUrl: string) {
  logger.group('🧪 Testing Drive Folder Access');
  try {
    // Extract folder ID from URL
    const folderIdMatch = folderUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
    if (!folderIdMatch) {
      throw new Error('Invalid folder URL format');
    }
    const folderId = folderIdMatch[1];
    logger.info('Testing folder ID:', folderId);

    // Try to get file info including the download URL
    const fileInfo = await getDirectFileUrl(folderId);
    if (fileInfo) {
      logger.success('Successfully found file:', fileInfo);
      
      // Only attempt parsing if Gemini API key is available
      if (genAI) {
        // Destructure the download URL
        const { fileId, mimeType } = fileInfo;
        
        // Try to get the file content using the download URL
        if (mimeType.startsWith('image/')) {
          logger.info('Attempting to parse image ticket...');
          const ticketDetails = await parseImageTicketWithGemini(fileId, mimeType);
          logger.info('Parsed ticket details:', ticketDetails);
        } else if (mimeType === 'application/pdf') {
          logger.info('Attempting to parse PDF ticket...');
          const ticketDetails = await parsePdfTicketWithGemini(fileId);
          logger.info('Parsed ticket details:', ticketDetails);
        }
      } else {
        logger.warn('Skipping ticket parsing - Gemini API key not available');
      }
    } else {
      logger.warn('No files found in the folder structure');
    }
  } catch (err) {
    logger.error('Test failed:', err);
    if (err instanceof Error) {
      logger.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
    }
  }
  logger.groupEnd();
} 