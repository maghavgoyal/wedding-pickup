import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GuestData {
  id: string;
  hash: string;
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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Return only fileId and mimeType, as downloadUrl is not reliable for server-side fetch
async function getDirectFileUrl(parentFolderId: string): Promise<{ fileId: string; mimeType: string } | null> {
  logger.group('Google Drive File Lookup');
  
  try {
    logger.info('Looking up Tickets folder in:', parentFolderId);
    
    // Call our API route to list files
    const response = await fetch(`/api/drive?action=listFiles&parentFolderId=${parentFolderId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch files: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    const files = data.files || [];
    
    if (files.length === 0) {
      logger.warn('No files found in Tickets folder');
      logger.groupEnd();
      return null;
    }

    const firstFile = files[0];
    logger.success('Found ticket file:', { 
      id: firstFile.id, 
      type: firstFile.mimeType, 
      name: firstFile.name,
    });
    logger.groupEnd();
    return { fileId: firstFile.id!, mimeType: firstFile.mimeType! };

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

    // Step 1: Download image using our API route
    const response = await fetch(`/api/drive?action=getFile&fileId=${fileId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to download image: ${error.error || response.statusText}`);
    }

    const { data: base64Data } = await response.json();
    logger.success('Image content fetched successfully');
    logger.info('Image converted to base64');

    // Step 2: Send base64 data to Gemini
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

    // Step 1: Download PDF using our API route
    const response = await fetch(`/api/drive?action=getFile&fileId=${fileId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to download PDF: ${error.error || response.statusText}`);
    }

    const { data: base64Data } = await response.json();
    logger.success('PDF content fetched successfully');
    logger.info('PDF converted to base64');

    // Step 2: Send base64 data to Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    logger.info('Sending PDF data to Gemini (model: gemini-1.5-flash)...');
    
    const result = await model.generateContent([
      "Extract the following information from this ticket/boarding pass: arrival date, arrival time, arrival location, flight/train/bus number, and number of travelers. Return the data in JSON format with these exact keys: arrivalDate, arrivalTime, pickupLocation, flightNumber, trainNumber, busNumber, numberOfGuests. If a value is not present, return null for that key.",
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
    const hashIndex = headers.indexOf('Hash');
    
    logger.info('Column Indexes:', { nameIndex, phoneIndex, driveLinkIndex, hashIndex });
    
    if (nameIndex === -1 || phoneIndex === -1 || driveLinkIndex === -1 || hashIndex === -1) {
      throw new Error('CSV must contain Name, Phone Number, Drive link, and Hash columns');
    }
    
    const guests = lines.slice(1).map((line: string, index: number) => {
      const values = line.split(',').map(value => value.trim().replace(/^"(.*)"$/, '$1'));
      
      const guest: GuestData = {
        id: (index + 1).toString(),
        hash: values[hashIndex] || '',
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